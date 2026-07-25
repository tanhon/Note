# Web 接口工程化基础：DTO、校验、异常与跨域

> 本文在三层架构基础上，补充正式 Web 项目中常见的 DTO、参数校验、统一错误处理和跨域问题。
>
> 为突出核心逻辑，代码片段省略了 `package` 和部分 `import`。IDEA 可自动导入所需类型；校验注解应来自 `jakarta.validation`。

## 1. 为什么不直接使用数据库实体接收和返回数据

数据库中的 `User` 可能包含：

```text
id、username、password、name、age
```

新增用户时，前端不应该传 `id`；查询用户时，后端不应该返回 `password`。因此通常使用 DTO 隔离接口数据与数据库对象。

```java
public record UserCreateRequest(
        String username,
        String password,
        String name,
        Integer age
) {
}
```

```java
public record UserResponse(
        Integer id,
        String username,
        String name,
        Integer age
) {
}
```

常见命名：

| 类型 | 用途 |
|---|---|
| `User` / Entity / PO | 数据库记录 |
| `UserCreateRequest` | 接收新增请求 |
| `UserUpdateRequest` | 接收修改请求 |
| `UserResponse` / VO | 返回给前端 |

> [!warning] 注意
> DTO 不是为了“多写几个类”，而是防止接口字段与数据库结构互相绑死，尤其要避免密码意外返回给前端。

## 2. 添加参数校验

项目需要 Bean Validation 依赖：

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-validation</artifactId>
</dependency>
```

给请求 DTO 添加规则：

```java
import jakarta.validation.constraints.*;

public record UserCreateRequest(
        @NotBlank(message = "用户名不能为空")
        @Size(min = 3, max = 20, message = "用户名长度应为3到20位")
        String username,

        @NotBlank(message = "密码不能为空")
        @Size(min = 6, max = 50, message = "密码长度应为6到50位")
        String password,

        @NotBlank(message = "姓名不能为空")
        String name,

        @NotNull(message = "年龄不能为空")
        @Min(value = 0, message = "年龄不能小于0")
        @Max(value = 150, message = "年龄不能大于150")
        Integer age
) {
}
```

Controller 使用 `@Valid` 触发校验：

```java
@PostMapping("/users")
public ResponseEntity<UserResponse> add(
        @Valid @RequestBody UserCreateRequest request) {
    UserResponse user = userService.add(request);
    return ResponseEntity.status(201).body(user);
}
```

校验失败时，Spring 会抛出参数校验异常，通常返回 `400 Bad Request`。

## 3. 常用校验注解

| 注解 | 作用 |
|---|---|
| `@NotNull` | 不能为 `null` |
| `@NotBlank` | 字符串不能为 `null`、空串或全空格 |
| `@Size` | 字符串、集合等长度范围 |
| `@Min` / `@Max` | 数字最小值、最大值 |
| `@Positive` | 必须是正数 |
| `@Email` | 邮箱格式 |
| `@Pattern` | 正则表达式校验 |

> [!tip] 区分
> “年龄必须是数字”属于请求格式校验；“用户名不能重复”需要查询数据库，属于 Service 层业务校验。

## 4. 三个层次的校验

```text
Controller/DTO：格式是否正确
Service：业务规则是否允许
数据库：唯一约束、非空约束等最终保护
```

例如新增用户：

1. DTO 检查用户名是否为空、年龄范围是否正确。
2. Service 检查用户名是否已经存在。
3. 数据库使用唯一索引防止并发情况下出现重复用户名。

三层校验不是重复，而是分别守住不同边界。

## 5. 业务异常

定义含义明确的异常：

```java
public class UserNotFoundException extends RuntimeException {

    public UserNotFoundException(Integer id) {
        super("用户不存在，id=" + id);
    }
}
```

Service 中抛出：

```java
public UserResponse findById(Integer id) {
    User user = userMapper.findById(id);
    if (user == null) {
        throw new UserNotFoundException(id);
    }
    return toResponse(user);
}
```

Service 不需要知道 HTTP 状态码；异常如何转换为 HTTP 响应由 Web 层统一决定。

## 6. 全局异常处理

可以使用 `@RestControllerAdvice` 集中处理异常：

```java
public record ApiError(
        int code,
        String message
) {
}
```

```java
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(UserNotFoundException.class)
    public ResponseEntity<ApiError> handleUserNotFound(
            UserNotFoundException exception) {
        return ResponseEntity.status(404)
                .body(new ApiError(404, exception.getMessage()));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiError> handleValidation(
            MethodArgumentNotValidException exception) {
        String message = exception.getBindingResult()
                .getFieldErrors()
                .stream()
                .findFirst()
                .map(DefaultMessageSourceResolvable::getDefaultMessage)
                .orElse("请求参数不正确");

        return ResponseEntity.badRequest()
                .body(new ApiError(400, message));
    }
}
```

这样 Controller 只处理正常流程，不必在每个方法中重复写 `try-catch`。

```text
请求 → Controller → Service
                    ↓ 抛出异常
       GlobalExceptionHandler
                    ↓
          统一的错误 JSON
```

> [!warning] 注意
> 不要把异常堆栈、SQL、数据库密码等内部细节直接返回给前端。详细异常写入服务端日志，前端只接收必要说明。

## 7. 是否必须统一成功响应

有些项目把成功结果包装成：

```json
{
  "code": 200,
  "message": "操作成功",
  "data": []
}
```

这是一种团队约定，不是 Spring Boot 强制要求。即使使用统一响应体，也应保留正确的 HTTP 状态码，例如：

- 查询成功：`200`
- 新增成功：`201`
- 删除成功且无响应体：`204`
- 参数错误：`400`
- 资源不存在：`404`

初学阶段可以先直接返回 DTO，重点掌握 HTTP 状态码与异常处理。

## 8. 什么是跨域 CORS

浏览器中的协议、域名或端口任一不同，就属于不同源。例如：

```text
前端：http://localhost:5500
后端：http://localhost:8080
```

浏览器可能拦截前端请求，这就是常见的跨域问题。

如果 `index.html` 放在后端的 `src/main/resources/static` 中，并通过同一个 `localhost:8080` 访问，通常不存在跨域。

学习阶段可以临时使用：

```java
@CrossOrigin(origins = "http://localhost:5500")
@RestController
public class UserController {
}
```

正式项目更适合集中配置允许的来源，或由前端开发服务器/网关代理请求。

> [!danger] 注意
> 不要在正式项目中随意允许所有来源、所有方法并携带凭证，这会扩大安全风险。

## 9. 包结构建议

```text
com.tanhong
├─ controller
├─ service
│  └─ impl
├─ mapper
├─ pojo
├─ dto
│  ├─ request
│  └─ response
├─ exception
└─ config
```

小项目不必过度拆包；当 DTO 和异常数量增加时，再按 `request`、`response` 等细分。

## 10. 一句话总结

> DTO 隔离接口与数据库模型，Bean Validation 检查请求格式，Service 检查业务规则，数据库约束提供最终保护；全局异常处理将异常统一转换成安全、清晰的 HTTP 错误响应。

---

## 导航

- [[0、SpringBoot笔记目录与学习路线|返回笔记目录]]
- [[4、SpringBoot配置文件与日志|上一篇：配置文件与日志]]
- [[6、分页查询与PageHelper|下一篇：分页查询与 PageHelper]]
