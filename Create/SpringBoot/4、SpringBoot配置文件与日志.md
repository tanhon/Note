# SpringBoot 配置文件与日志

## 本篇快速复习

- 配置文件描述“程序在当前环境中怎么运行”，例如端口、数据库、Session 和日志级别。
- `properties` 与 YAML 能表达同样的配置；YAML 层级更清楚，但只能用空格缩进，不能用 Tab。
- `application-{profile}.yml` 用于区分开发、测试和生产环境；敏感值优先使用环境变量。
- `@Value` 适合少量配置，`@ConfigurationProperties` 适合一组结构化配置。
- 日志级别从详细到严重是 `TRACE < DEBUG < INFO < WARN < ERROR`。
- 可预料的业务拒绝通常记 `WARN`，系统故障、未知异常通常记 `ERROR`。
- 普通 SLF4J 日志用于排错，AOP 操作日志属于审计记录，两者目的不同。
- `StdOutImpl` 适合学习查看 SQL；正式环境更适合通过日志框架统一控制。

> 配套项目：`Springboot-mybatis` 与 `employee-management`。配置决定程序如何运行，日志帮助我们判断程序运行到了哪里、为什么失败。
>
> 代码片段为核心写法，省略了 `package` 和部分 `import`。当前项目已包含 Lombok；未引入 Lombok 时请使用文中的手动 `Logger` 写法。

## 1. 为什么需要配置文件

端口、数据库地址、日志级别等内容会随环境变化，不适合写死在 Java 代码中。

```text
Java 代码：描述程序做什么
配置文件：描述程序在当前环境中怎么运行
```

Spring Boot 默认读取：

```text
src/main/resources/application.properties
src/main/resources/application.yml
```

## 2. `properties` 与 `yml` 的区别

两者功能基本相同，主要区别是写法。

```properties
spring.datasource.url=jdbc:mysql://localhost:3306/jdbctest
spring.datasource.username=root
server.port=8080
```

等价的 YAML：

```yaml
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/jdbctest
    username: root
server:
  port: 8080
```

| 对比项 | `properties` | `yml` |
|---|---|---|
| 结构 | `key=value` | 通过缩进表示层级 |
| 优点 | 简单直接，不易出现缩进问题 | 层级清晰，重复前缀少 |
| 注意 | 相同前缀重复较多 | 只能使用空格缩进，不能使用 Tab |

> [!warning] 注意
> 同一项目建议统一使用一种格式。若两个文件定义同一个配置，排查覆盖关系会变得困难。

## 3. 当前项目配置示例

```yaml
spring:
  application:
    name: employee-management
  datasource:
    driver-class-name: com.mysql.cj.jdbc.Driver
    url: jdbc:mysql://localhost:3306/tlias
    username: root
    password: "${DB_PASSWORD}"

mybatis:
  mapper-locations: classpath*:/com/tanhong/mapper/*.xml
  configuration:
    map-underscore-to-camel-case: true

server:
  servlet:
    session:
      timeout: 30m
      cookie:
        http-only: true
        same-site: lax
        secure: false
```

`${DB_PASSWORD}` 表示从环境变量读取密码。若写成 `${DB_PASSWORD:123456}`，冒号后面是环境变量不存在时的默认值。

当前项目的 `application.yaml` 仍包含本地学习用明文密码，应在正式项目中改成环境变量。

> [!warning] Cookie 的 `secure`
> 本地使用 HTTP 时通常设为 `false`；部署到 HTTPS 后应改为 `true`。`http-only` 可以阻止普通 JavaScript 读取 JSESSIONID，`same-site` 用于限制跨站携带 Cookie。

## 4. 多环境配置 Profile

不同环境通常使用不同配置：

```text
application.yml          公共配置
application-dev.yml      开发环境
application-test.yml     测试环境
application-prod.yml     生产环境
```

在主配置中启用开发环境：

```yaml
spring:
  profiles:
    active: dev
```

也可以在启动时指定：

```text
--spring.profiles.active=prod
```

> [!warning] 注意
> 不要把生产数据库密码提交到 Git 仓库。可通过环境变量、部署平台密钥或外部配置文件提供。

## 5. 在 Java 中读取配置

读取单个简单值可以使用 `@Value`：

```java
@Value("${server.port:8080}")
private int port;
```

一组相关配置更适合使用 `@ConfigurationProperties`：

```yaml
app:
  user-page-size: 10
  allow-register: true
```

```java
@ConfigurationProperties(prefix = "app")
public record AppProperties(
        int userPageSize,
        boolean allowRegister
) {
}
```

需要启用配置属性扫描：

```java
@SpringBootApplication
@ConfigurationPropertiesScan
public class SpringbootMybatisApplication {
}
```

选择原则：

- 一个值：可以使用 `@Value`。
- 多个相关值：优先使用 `@ConfigurationProperties`，类型更清晰，也便于集中管理。

## 6. 什么是日志

日志是程序运行过程的记录，常用于：

- 确认请求是否到达。
- 查看方法执行到哪一步。
- 记录重要业务事件。
- 定位异常和 SQL 问题。

Spring Boot 默认使用 SLF4J 日志门面，并提供默认日志实现。业务代码只需要面向统一日志 API。

使用 Lombok：

```java
@Slf4j
@Service
public class UserServiceImpl {

    public User findById(Integer id) {
        log.debug("开始查询用户，id={}", id);
        return null;
    }
}
```

不使用 Lombok：

```java
private static final Logger log =
        LoggerFactory.getLogger(UserServiceImpl.class);
```

## 7. 常见日志级别

从详细到严重：

```text
TRACE < DEBUG < INFO < WARN < ERROR
```

| 级别 | 使用场景 |
|---|---|
| `TRACE` | 极细的执行轨迹，平时很少开启 |
| `DEBUG` | 调试变量、SQL、方法流程 |
| `INFO` | 启动成功、关键业务正常完成 |
| `WARN` | 可以继续运行，但存在风险 |
| `ERROR` | 操作失败或发生异常 |

配置示例：

```yaml
logging:
  level:
    root: INFO
    com.tanhong: DEBUG
    com.tanhong.mapper: DEBUG
  file:
    name: logs/springboot-mybatis.log
```

`root: INFO` 表示全局只显示 `INFO` 及以上；`com.tanhong: DEBUG` 单独为项目代码开启更详细日志。

## 8. 正确记录日志

推荐参数化写法：

```java
log.info("新增用户成功，id={}", user.getId());
log.warn("未找到用户，id={}", id);
log.error("查询用户失败，id={}", id, exception);
```

不推荐字符串拼接：

```java
log.debug("用户信息：" + user);
```

原因是即使 `DEBUG` 没开启，也可能提前执行字符串拼接和 `toString()`。

> [!danger] 不得记录
> 明文密码、令牌、身份证号、银行卡号等敏感信息。当前 `User` 若使用 Lombok `@Data`，打印整个对象可能把 `password` 一并写入日志。

### 为什么业务异常经常使用 `WARN`，而不是 `ERROR`

> **问：** “班级中还有学生，不能删除”为什么记 `WARN`？
>
> **答：** 这是程序预料到的业务冲突，系统仍然正常工作，只是拒绝了本次操作。数据库连接失败、未知空指针、代码缺陷等系统性失败才更适合记 `ERROR`。

```text
DEBUG  调试细节
INFO   正常关键事件
WARN   可预料但值得关注的问题
ERROR  系统失败、未知异常、需要处理的故障
```

同一个异常不要在 Controller、Service、Mapper 每层重复打印完整堆栈，通常在统一边界记录一次即可。

### 普通运行日志与操作审计日志

```text
log.info / warn / error     → 写给开发和运维人员，帮助排错
OperationLogAspect         → 记录谁在何时执行了什么业务操作
```

AOP 操作日志、敏感参数处理和当前用户获取详见 [[9、Spring AOP、操作日志与ThreadLocal]]。

## 9. MyBatis SQL 日志怎么看

常见内容：

```text
Preparing: select id, username, name, age from user where id = ?
Parameters: 1(Integer)
Total: 1
```

含义：

- `Preparing`：准备执行的 SQL，参数位置显示为 `?`。
- `Parameters`：传入的真实参数及类型。
- `Total`：查询结果行数。

排错顺序：

1. SQL 是否执行。
2. SQL 和 `where` 是否正确。
3. 参数值和类型是否正确。
4. 返回行数是否符合预期。
5. Java 字段映射是否正确。

> [!warning] 注意
> `DEBUG` SQL 日志适合开发排错，生产环境长期大量开启会增加磁盘和性能压力。

如果配置：

```yaml
mybatis:
  configuration:
    log-impl: org.apache.ibatis.logging.stdout.StdOutImpl
```

SQL 会直接输出到控制台，不能完全依靠 `logging.level` 控制。它适合学习观察 SQL；正式项目更适合使用 SLF4J 日志实现并统一管理级别和输出位置。

## 10. 常见问题

### 中文注释或日志乱码

确认源文件与配置文件使用 UTF-8 保存，IDEA 的项目编码也设置为 UTF-8。YAML 中如果出现乱码注释，应重新以 UTF-8 保存，而不是只修改终端字体。

### 修改配置后没有生效

检查：

- 文件是否位于 `src/main/resources`。
- 配置键名和缩进是否正确。
- 是否启用了其他 Profile 并覆盖当前值。
- 是否需要重启应用。

## 11. 一句话总结

> `properties` 与 `yml` 都用于外部化配置；Profile 用于区分环境，环境变量用于保护敏感值；日志通过级别控制输出范围，用参数化方式记录必要信息，并严禁泄露密码等敏感数据。

## 参考资料

- [Spring Boot Externalized Configuration](https://docs.spring.io/spring-boot/reference/features/external-config.html)
- [Spring Boot Logging](https://docs.spring.io/spring-boot/reference/features/logging.html)

---

## 导航

- [[0、SpringBoot笔记目录与学习路线|返回笔记目录]]
- [[5、Web接口工程化基础：DTO、校验、异常与跨域|下一篇：Web 接口工程化基础]]
