> 适合初学者。本文以 IntelliJ IDEA、Maven、Java 17 和 Spring Boot 3.x 为例。

## 1. 先理解整体流程

```text
浏览器 / Postman / IDEA HTTP Client
              ↓ 发送 HTTP 请求
        Spring Boot 应用
              ↓ 根据 URL 找到 Controller 方法
          执行业务代码
              ↓ 生成 HTTP 响应
浏览器 / Postman / IDEA HTTP Client
```

一句话：**客户端发送请求，服务器处理请求，再返回响应。**

---

## 2. 使用 IDEA 创建 Spring Boot 项目

### 2.1 准备环境

需要安装：

- JDK 17 或更高版本
- IntelliJ IDEA
- Maven（IDEA 通常已经内置）

在 IDEA 中检查 JDK：

```text
File → Project Structure → Project → SDK
```

### 2.2 创建项目

1. 打开 IDEA，选择 `New Project`。
2. 选择 `Spring Initializr`。（新版本显示 Spring Boot）
3. 填写项目信息：
   - Language：`Java`
   - Type：`Maven`
   - JDK：`17` 或更高
   - Spring Boot：选择 `3.x` 的稳定版本
   - Group：`com.example`
   - Artifact：`demo`
4. 选择依赖 `Spring Web`。
5. 选择保存位置，点击 `Create`。
6. 等待 IDEA 下载依赖并完成项目加载。

`Group` 一般表示组织名，`Artifact` 表示项目名。

### 2.3 主要目录结构

```text
demo
├─ src
│  ├─ main
│  │  ├─ java
│  │  │  └─ com.example.demo
│  │  │     └─ DemoApplication.java
│  │  └─ resources
│  │     └─ application.properties
│  └─ test
└─ pom.xml
```

- `DemoApplication.java`：项目启动入口。
- `application.properties`：项目配置文件。
- `pom.xml`：管理依赖和项目构建。
- `src/test`：存放测试代码。

启动类通常如下：

```java
@SpringBootApplication
public class DemoApplication {
    public static void main(String[] args) {
        SpringApplication.run(DemoApplication.class, args);
    }
}
```

`@SpringBootApplication` 表示这是 Spring Boot 的启动类。

### 2.4 启动项目

打开启动类，点击 `main` 方法左侧的绿色三角形，选择 `Run`。

控制台出现类似内容，说明启动成功：

```text
Tomcat started on port 8080
Started DemoApplication
```

默认访问地址：

```text
http://localhost:8080
```

其中：

- `localhost` 表示本机。
- `8080` 是默认端口。

刚创建的项目还没有 `/` 接口，所以直接访问这个地址可能显示 `404`。这不代表启动失败；创建下面的接口后，应访问 `/hello`。

若接口被占用，可以在 `application.properties` 中修改端口：

```properties
server.port=8081
```

或者，打开以管理员身份打开 Windows 终端，在终端先后输入

``` powershell
netstat -ano | findstr :8080
taskkill /PID [进程ID] /F
```

这里的 `[进程 ID]` 是第一个命令的输出结果后面的数字。

---

## 3. 创建第一个接口

在启动类所在包或其子包中创建 `HelloController.java`：

```java
package com.example.demo.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class HelloController {

    @GetMapping("/hello")
    public String hello() {
        return "Hello Spring Boot";
    }
}
```

启动项目后访问：

```text
http://localhost:8080/hello
```

浏览器会显示：

```text
Hello Spring Boot
```

### 3.1 两个重要注解

#### `@RestController`

表示这个类是一个 REST 接口控制器。

作用：

- 接收 HTTP 请求。
- 将方法返回值直接写入 HTTP 响应体。

它可以简单理解为：

```java
@Controller + @ResponseBody
```

#### `@GetMapping("/hello")` 与 `@RequestMapping`

`@GetMapping("/hello")` 表示把 `GET /hello` 请求映射到该方法。

访问 `/hello` 时，Spring 就会执行 `hello()` 方法。

`@GetMapping` 是 `@RequestMapping` 的快捷写法，并且只处理 `GET` 请求。`@RequestMapping` 默认不限制 HTTP 请求方法。

如果写在类上，它表示该类所有接口的统一路径前缀：

```java
@RestController
@RequestMapping("/users")
public class UserController {

    @GetMapping("/list")
    public String list() {
        return "用户列表";
    }
}
```

完整地址为：

```text
http://localhost:8080/users/list
```

---

## 4. HTTP 请求

HTTP 请求是**客户端发送给服务器的数据**，表示客户端想做什么。

一个请求主要由四部分组成：

```text
请求方法 + 请求地址 + 请求头 + 请求体
```

示例：

```http
POST /users HTTP/1.1
Host: localhost:8080
Content-Type: application/json
                                 <!--这里一定是空一行-->
{
  "name": "小明",
  "age": 20
}
```

### 4.1 常用请求方法

| 请求方法 | 常见作用 | 示例 |
|---|---|---|
| `GET` | 查询数据 | 查询用户 |
| `POST` | 新增数据 | 新增用户 |
| `PUT` | 修改完整数据 | 修改用户全部信息 |
| `PATCH` | 修改部分数据 | 只修改用户名 |
| `DELETE` | 删除数据 | 删除用户 |

Spring 中常用的对应注解：

```java
@GetMapping("/users")
@PostMapping("/users")
@PutMapping("/users/{id}")
@PatchMapping("/users/{id}")
@DeleteMapping("/users/{id}")
```

这些注解都属于 `@RequestMapping` 的快捷写法，并且限制了请求方法。

### 4.2 URL 的组成

```text
http://localhost:8080/users/10?detail=true
│      │         │    │        │
协议   主机名     端口  路径     查询参数
```

### 4.3 请求头 Header

请求头用于传递请求的附加信息，例如：

```http
Content-Type: application/json
Authorization: Bearer token值
```

- `Content-Type`：请求体的数据格式。
- `Authorization`：身份认证信息。

在 Spring 中获取请求头：

```java
@GetMapping("/token")
public String token(@RequestHeader("Authorization") String authorization) {
    return authorization;
}
```

### 4.4 请求体 Body

请求体用于提交数据，通常用于 `POST`、`PUT`、`PATCH` 请求。

常见的 JSON 请求体：

```json
{
  "name": "小明",
  "age": 20
}
```

---

## 5. Spring Boot 接收请求参数

### 5.1 查询参数：`@RequestParam`

请求地址：

```text
GET /hello?name=小明
```

代码：

```java
@GetMapping("/hello")
public String hello(@RequestParam String name) {
    return "你好，" + name;
}
```

带默认值：

```java
@GetMapping("/hello")
public String hello(
        @RequestParam(defaultValue = "游客") String name) {
    return "你好，" + name;
}
```

### 5.2 路径参数：`@PathVariable`

请求地址：

```text
GET /users/10
```

代码：

```java
@GetMapping("/users/{id}")
public String getUser(@PathVariable Long id) {
    return "查询用户：" + id;
}
```

`10` 会被赋值给参数 `id`。

### 5.3 JSON 请求体：`@RequestBody`

在 `com.example.demo.model` 包中新建 `User.java`。Java 17 可以使用 `record` 简洁地定义数据类：

```java
package com.example.demo.model;

public record User(Long id, String name, Integer age) {}
```

再创建接口：

```java
@PostMapping("/users")
public User addUser(@RequestBody User user) {
    return user;
}
```

发送 JSON：

```json
{
  "name": "小明",
  "age": 20
}
```

`@RequestBody` 会把 JSON 转换成 Java 对象。

发送 JSON 时必须设置请求头：

```http
Content-Type: application/json
```

### 5.4 三种参数的区别

| 注解 | 数据位置 | 示例 |
|---|---|---|
| `@RequestParam` | URL 查询参数 | `/users?name=小明` |
| `@PathVariable` | URL 路径 | `/users/10` |
| `@RequestBody` | 请求体 | JSON 数据 |

---

## 6. HTTP 响应

HTTP 响应是**服务器处理完请求后返回给客户端的数据**。

一个响应主要由三部分组成：

```text
状态码 + 响应头 + 响应体
```

示例：

```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "id": 10,
  "name": "小明"
}
```

### 6.1 常见状态码

| 状态码 | 含义 |
|---|---|
| `200 OK` | 请求成功 |
| `201 Created` | 创建成功 |
| `204 No Content` | 成功，但没有响应体 |
| `400 Bad Request` | 请求参数有误 |
| `401 Unauthorized` | 未登录或认证失败 |
| `403 Forbidden` | 没有访问权限 |
| `404 Not Found` | 请求的资源不存在 |
| `500 Internal Server Error` | 服务器内部异常 |

状态码分类：

- `2xx`：成功。
- `4xx`：客户端请求有问题。
- `5xx`：服务器处理出现问题。

### 6.2 返回文本

```java
@GetMapping("/hello")
public String hello() {
    return "Hello";
}
```

响应体是：

```text
Hello
```

### 6.3 返回 JSON

```java
@GetMapping("/users/{id}")
public User getUser(@PathVariable Long id) {
    return new User(id, "小明", 20);
}
```

Spring Boot 会自动把 Java 对象转换为 JSON：

```json
{
  "id": 10,
  "name": "小明",
  "age": 20
}
```

### 6.4 使用 `ResponseEntity` 控制完整响应

`ResponseEntity` 可以同时设置状态码、响应头和响应体。

```java
@PostMapping("/users")
public ResponseEntity<User> addUser(@RequestBody User user) {
    return ResponseEntity.status(201).body(user);
}
```

这里返回：

- 状态码：`201 Created`
- 响应体：用户 JSON 数据

查询不到数据时可以返回 `404`：

```java
@GetMapping("/users/{id}")
public ResponseEntity<User> getUser(@PathVariable Long id) {
    if (id != 10) {
        return ResponseEntity.notFound().build();
    }

    return ResponseEntity.ok(new User(10L, "小明", 20));
}
```

---

## 7. 完整 Controller 示例

```java
package com.example.demo.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.example.demo.model.User;

@RestController
@RequestMapping("/users")
public class UserController {

    @GetMapping("/{id}")
    public String getUser(@PathVariable Long id) {
        return "查询用户：" + id;
    }

    @GetMapping
    public String searchUser(
            @RequestParam(defaultValue = "全部") String name) {
        return "查询条件：" + name;
    }

    @PostMapping
    public ResponseEntity<User> addUser(@RequestBody User user) {
        return ResponseEntity.status(201).body(user);
    }

    @PutMapping("/{id}")
    public String updateUser(
            @PathVariable Long id,
            @RequestBody User user) {
        return "修改用户：" + id;
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable Long id) {
        return ResponseEntity.noContent().build();
    }
}
```

对应关系：

| 功能 | 方法 | 地址 |
|---|---|---|
| 查询一个用户 | `GET` | `/users/10` |
| 按条件查询 | `GET` | `/users?name=小明` |
| 新增用户 | `POST` | `/users` |
| 修改用户 | `PUT` | `/users/10` |
| 删除用户 | `DELETE` | `/users/10` |

---

## 8. 在 IDEA 中测试接口

### 8.1 使用浏览器

浏览器地址栏适合测试简单的 `GET` 请求：

```text
http://localhost:8080/hello
```

浏览器地址栏不适合测试带 JSON 请求体的 `POST`、`PUT` 请求。

### 8.2 使用 IDEA HTTP Client

在项目中新建 `requests.http` 文件：

```http
### 查询用户
GET http://localhost:8080/users/10

### 使用查询参数
GET http://localhost:8080/users?name=小明

### 新增用户
POST http://localhost:8080/users
Content-Type: application/json

{
  "name": "小明",
  "age": 20
}

### 删除用户
DELETE http://localhost:8080/users/10
```

点击每个请求左侧的绿色运行按钮，即可发送请求并查看响应。

不同 IDEA 版本或授权版本的创建入口和 HTTP Client 功能可能不同。如果找不到 `Spring Initializr`，可以在 [Spring Initializr](https://start.spring.io/) 生成项目后用 IDEA 打开；如果不能运行 `.http` 文件，也可以使用 Postman、Apifox 等工具测试接口。

---

## 9. 一次请求在 Spring Boot 中经历了什么

以访问 `GET /hello` 为例：

1. 客户端向 `localhost:8080/hello` 发送 HTTP 请求。
2. Spring Boot 内置的 Web 服务器接收到请求。
3. Spring 根据 `/hello` 找到对应的 Controller 方法。
4. Spring 调用该方法。
5. 方法返回字符串或 Java 对象。
6. Spring 将返回值写入 HTTP 响应体；Java 对象通常会被转换为 JSON。
7. 客户端收到状态码、响应头和响应体。

---

## 10. 常见问题

### 10.1 访问接口出现 404

可能原因：

- 请求地址写错。
- Controller 没有放在启动类所在包或其子包中。
- 方法上的映射注解写错。
- 项目没有成功启动。

### 10.2 出现 405 Method Not Allowed

请求方法不匹配。例如接口使用 `@PostMapping`，但客户端发送了 `GET` 请求。

### 10.3 出现 400 Bad Request

常见原因：

- 缺少必填参数。
- JSON 格式错误。
- 参数类型不匹配，例如把文字传给 `Integer`。

### 10.4 出现 500 Internal Server Error

服务器执行代码时发生异常。需要查看 IDEA 控制台中的错误信息。

### 10.5 出现 415 Unsupported Media Type

服务器不支持客户端发送的数据格式。发送 JSON 时需要添加：

```http
Content-Type: application/json
```

### 10.6 端口被占用

控制台可能出现：

```text
Port 8080 was already in use
```

可以关闭占用端口的程序，或者修改端口：

```properties
server.port=8081
```

---

## 11. 核心知识速记

```text
@RestController  接收请求并直接返回数据
@RequestMapping  映射请求路径，可用于类或方法
@GetMapping      处理 GET 请求
@PostMapping     处理 POST 请求
@PutMapping      处理 PUT 请求
@DeleteMapping   处理 DELETE 请求
@RequestParam    获取 URL 查询参数
@PathVariable    获取 URL 路径参数
@RequestBody     获取请求体中的 JSON 数据
@RequestHeader   获取请求头
ResponseEntity   设置响应状态码、响应头和响应体
```

最重要的理解：

```text
URL 和请求方法决定执行哪个 Controller 方法；
请求参数进入方法，方法返回值成为响应数据。
```

## 12. 自测题

1. `@RestController` 的作用是什么？
2. `@GetMapping("/hello")` 表示什么？它和 `@RequestMapping` 有什么关系？
3. `GET` 和 `POST` 的常见用途有什么不同？
4. HTTP 请求由哪几个主要部分组成？
5. HTTP 响应由哪几个主要部分组成？
6. `@RequestParam`、`@PathVariable`、`@RequestBody` 分别获取哪里的数据？
7. 状态码 `200`、`404`、`500` 分别表示什么？
8. 为什么浏览器地址栏不适合测试 JSON `POST` 请求？
