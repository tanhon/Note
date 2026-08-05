# Bean 进阶：作用域、第三方 Bean 与 `@Import`

## 本篇快速复习

- Bean 是由 Spring IoC 容器创建和管理的对象；DI 负责把 Bean 需要的依赖传进去。
- 自己编写的组件通常通过 `@Component`、`@Service` 等注解配合组件扫描注册。
- 第三方类不能直接加组件注解时，通常使用 `@Configuration` 和 `@Bean` 注册。
- 推荐构造器注入；只有一个构造器时可以省略 `@Autowired`，但 Spring 不会生成构造器。
- Bean 默认是 `singleton`；单例 Controller、Service 会被多个请求共享，应保持无状态。
- Bean 大致经历“创建 → 注入 → 初始化 → 使用 → 销毁”。
- `@Import` 可以导入指定类或配置，**不会下载第三方依赖**。
- 当前项目的组件、Mapper 代理、手动 `@Bean` 和自动配置对象最终都进入同一个 IoC 容器。

> [!info] 学习环境
> JDK 21、Spring Boot 4.0.7、当前 `employee-management` 多模块项目。

---

## 1. Bean、IoC 与 DI

**结论：IoC 管理对象，DI 连接对象，被管理的对象就是 Bean。**

```java
@Service
public class EmpServiceImpl implements EmpService {

    private final EmpMapper empMapper;

    public EmpServiceImpl(EmpMapper empMapper) {
        this.empMapper = empMapper;
    }
}
```

Spring 启动后会：

1. 创建 `EmpMapper` 代理 Bean；
2. 创建 `EmpServiceImpl` Bean；
3. 把 `EmpMapper` 传入构造器；
4. 保存和管理这些对象。

```text
IoC：对象由谁创建和管理
Bean：被Spring管理的对象
DI：依赖对象怎样传入
```

常用 IoC 容器接口是 `ApplicationContext`。日常业务代码通常不需要主动从容器取对象，因为依赖注入已经完成对象连接。

> [!warning] 不要随意手动 `new` Service
> 自己创建的 Service 不一定具备 Spring 提供的依赖注入、事务和 AOP 代理能力。

---

## 2. 组件扫描：注册自己的类

**结论：组件扫描在指定包中寻找组件注解，并把符合条件的类注册成 Bean。**

| 注解 | 常见位置 | 含义 |
|---|---|---|
| `@Component` | 普通组件 | 通用 Bean 注解 |
| `@Service` | Service 实现类 | 业务组件 |
| `@Repository` | Dao 实现类 | 数据访问组件 |
| `@Controller` | MVC Controller | 通常参与视图处理 |
| `@RestController` | REST Controller | 将返回值写入响应体 |
| `@Configuration` | 配置类 | 定义配置和 `@Bean` 方法 |

`@Service` 等注解已经具有 `@Component` 的作用，不需要重复标注。

### 默认扫描范围

`@SpringBootApplication` 默认扫描启动类所在包及其子包。当前启动类位于：

```text
com.tanhong.EmployeeManagementApplication
```

所以可以扫描 `com.tanhong.controller`、`com.tanhong.service.impl`、`com.tanhong.security` 等包。即使类位于依赖模块的 JAR 中，只要在运行时 classpath 上并处于扫描包内，也能被发现。

> [!warning] 启动类尽量放在根包
> 组件放在启动类包之外时，默认扫描可能找不到它。

### 接口为什么通常不标 `@Service`

普通接口不能直接创建对象，`@Service` 应放在实现类：

```java
public interface EmpService {
}

@Service
public class EmpServiceImpl implements EmpService {
}
```

MyBatis Mapper 是特殊情况：MyBatis 会通过 `@Mapper` 或 `@MapperScan` 为接口创建代理 Bean。

---

## 3. 构造器注入

**结论：必要依赖应通过构造器传入，并尽量保存为 `final` 字段。**

构造器注入的主要优点：

- 依赖关系清楚；
- 对象创建后依赖已经齐全；
- 字段可以使用 `final`；
- 方便单元测试；
- 更容易发现循环依赖。

### 为什么可以省略 `@Autowired`

类只有一个构造器时，Spring 会自动使用它完成注入：

```java
public EmpServiceImpl(EmpMapper empMapper) {
    this.empMapper = empMapper;
}
```

省略的是 `@Autowired`，不是构造器。

### 为什么删除手写构造器也可能不报错

```java
@Service
@RequiredArgsConstructor
public class EmpServiceImpl implements EmpService {
    private final EmpMapper empMapper;
}
```

Lombok 的 `@RequiredArgsConstructor` 会在编译期间生成构造器。构造器是 Lombok 生成的，不是 Spring 生成的。

> [!warning] 注意
> 只有 `final` 字段，既没有手写构造器，也没有 Lombok 构造器注解时，Java 通常会因字段未初始化而编译失败。

### 同类型 Bean 有多个怎么办

```text
@Primary    指定默认实现
@Qualifier  在注入位置精确选择
```

```java
public UserServiceImpl(
        @Qualifier("txtUserDaoImpl") UserDao userDao) {
    this.userDao = userDao;
}
```

---

## 4. Bean 的作用域

**结论：作用域决定 Spring 在什么范围内复用同一个 Bean 实例。**

| 作用域 | 含义 | 常见用途 |
|---|---|---|
| `singleton` | 一个 Spring 容器通常一个实例 | Controller、Service、Mapper |
| `prototype` | 每次向容器获取时创建新实例 | 少量独立状态对象 |
| `request` | 每个 HTTP 请求一个实例 | 单次请求状态 |
| `session` | 每个 HTTP Session 一个实例 | 会话状态 |
| `application` | 每个 Web 应用一个实例 | 应用级共享对象 |

普通组件默认是 singleton。显式指定 prototype：

```java
@Component
@Scope(ConfigurableBeanFactory.SCOPE_PROTOTYPE)
public class TemporaryTask {
}
```

Web 作用域可使用 `@RequestScope`、`@SessionScope`、`@ApplicationScope`。

> [!note] singleton 的准确范围
> 它表示“每个 Spring IoC 容器一个实例”，不是整个 JVM 永远只能创建一个该类型对象。

### 单例 Bean 为什么应保持无状态

错误示例：

```java
@Service
public class EmpServiceImpl {
    // 多个请求会共享并修改它
    private Integer currentEmpId;
}
```

更安全的做法：

- 请求数据放在方法参数和局部变量；
- 长期数据存入数据库；
- 当前用户从 Spring Security 上下文读取；
- 成员字段主要保存 `final` 依赖。

> [!warning] singleton 不等于线程安全
> Spring 不会自动保护你写入实例字段的数据。无状态设计才是 Controller、Service 安全共享的关键。

> [!note] prototype 小提示
> prototype 直接注入 singleton 时，通常只在注入时取得一次。需要每次动态获取新实例时可进一步了解 `ObjectProvider`。

---

## 5. Bean 生命周期

**结论：singleton Bean 通常经历创建、注入、初始化、使用和销毁。**

```text
读取Bean定义
  → 调用构造器
  → 注入依赖
  → 初始化
  → 对外使用
  → 容器关闭时销毁
```

```java
@Component
public class FileClient {

    @PostConstruct
    public void init() {
        // 依赖已注入，可进行初始化检查
    }

    @PreDestroy
    public void close() {
        // 释放自己持有的资源
    }
}
```

Spring Boot 4 使用：

```java
import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
```

第三方对象也可以指定生命周期方法：

```java
@Bean(initMethod = "connect", destroyMethod = "close")
public ThirdPartyClient thirdPartyClient() {
    return new ThirdPartyClient();
}
```

Spring 还可能在创建过程中为事务和 AOP 包装代理。因此自己 `new` 的 Service 上，`@Transactional` 或切面可能不生效。

> [!warning] prototype 销毁
> Spring 通常不会替每个 prototype 实例完整执行销毁流程，使用方需要负责释放其资源。

---

## 6. 第三方 Bean：`@Configuration` 与 `@Bean`

**结论：不能修改第三方类源码时，在配置类中创建对象，再通过 `@Bean` 交给 Spring。**

当前项目中的密码编码器：

```java
@Configuration
public class SecurityConfig {

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
```

随后 Service 可以依赖接口：

```java
public EmpServiceImpl(PasswordEncoder passwordEncoder) {
    this.passwordEncoder = passwordEncoder;
}
```

默认 Bean 名称是方法名 `passwordEncoder`，也可写成：

```java
@Bean("bcryptEncoder")
```

| 场景 | 推荐方式 |
|---|---|
| 自己编写的 Controller、Service | 组件注解 |
| 第三方库中的类 | `@Configuration` + `@Bean` |
| 创建过程需要参数或自定义步骤 | `@Bean` |

---

## 7. `@Import`：主动导入类或配置

**结论：`@Import` 影响 Spring Bean 注册，不负责下载 JAR。**

```java
@Configuration
@Import(SmsClientConfig.class)
public class AppConfig {
}
```

导入后，Spring 会处理 `SmsClientConfig` 及其中定义的 Bean。

```text
pom.xml引入依赖
作用：下载JAR，让类进入classpath

@Import(SmsClientConfig.class)
作用：让Spring处理已经存在的类或配置
```

常见形式：

```java
@Import(MyComponent.class)       // 直接注册类
@Import(MyConfig.class)          // 导入配置类
@Import(MyImportSelector.class)  // 按逻辑选择类，进阶用法
```

> [!warning] 三种 import 不要混淆
> Java `import` 只简化类名；Maven 下载依赖；Spring `@Import` 才影响 Bean 注册。

---

## 8. 当前项目中的 Bean 来源

**结论：注册方式虽然不同，但最终都由同一个 IoC 容器统一管理。**

| 对象 | 来源 |
|---|---|
| Controller | `@RestController` + 组件扫描 |
| Service 实现类 | `@Service` + 组件扫描 |
| `CurrentUserProvider` | `@Component` + 组件扫描 |
| `OperationLogAspect` | `@Aspect`、`@Component` + 组件扫描 |
| `SecurityConfig` | `@Configuration` + 组件扫描 |
| `PasswordEncoder`、`SecurityFilterChain` | 配置类中的 `@Bean` |
| Mapper | `@MapperScan` 后由 MyBatis 创建代理 |
| Web、数据源等基础设施 | 自动配置 |

自动配置详见 [[11、SpringBoot起步依赖与自动配置]]。

---

## 9. 常见问答

### 问：有 `@Component` 为什么仍然注入失败？

检查类是否在扫描范围、使用方是否也是 Bean、类型是否匹配、是否存在多个候选，以及对应模块是否在运行时 classpath。

### 问：接口上写 `@Service` 可以吗？

普通接口不能实例化，通常标在实现类上。Mapper 能注入是因为 MyBatis 创建了代理 Bean。

### 问：一个单例 Service 会为每个用户创建对象吗？

不会。多个请求通常共享同一个 Service Bean，所以不能用成员变量保存某个用户的临时状态。

### 问：`@Bean` 方法能接收其他 Bean 吗？

可以，Spring 会注入方法参数：

```java
@Bean
public SmsService smsService(SmsClient smsClient) {
    return new SmsService(smsClient);
}
```

### 问：`@Import` 会下载依赖吗？

不会。Maven 下载依赖，`@Import` 只处理 classpath 中已经存在的类。

---

## 10. 最终检查

**结论：排查 Bean 问题时，依次检查“类是否存在、是否注册、是否匹配、是否由 Spring 创建”。**

- [ ] 组件是否位于扫描范围？
- [ ] `@Service` 是否标在实现类？
- [ ] 是否优先使用构造器注入？
- [ ] 同类型多个 Bean 是否使用 `@Primary` 或 `@Qualifier`？
- [ ] singleton Bean 是否避免保存请求状态？
- [ ] 第三方对象是否通过配置集中注册？
- [ ] 生命周期结束时是否释放自己持有的资源？
- [ ] 被 `@Import` 的类是否已经存在于 classpath？

---

## 一句话总结

> Spring 通过组件扫描、`@Bean`、`@Import` 等方式注册 Bean，由 IoC 容器管理其作用域和生命周期，再通过 DI 连接对象；默认单例组件应保持无状态，第三方对象应通过配置集中注册。

---

## 继续学习

- [[2、Spring三层架构、内聚与耦合、IoC与DI]]
- [[11、SpringBoot起步依赖与自动配置]]
- [[12、Maven高级与多模块项目]]
- [[0、SpringBoot笔记目录与学习路线|返回笔记目录]]
