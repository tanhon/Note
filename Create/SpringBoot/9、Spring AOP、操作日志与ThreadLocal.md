# Spring AOP、操作日志与 ThreadLocal

> 配套项目：<code>D:\Springboot\employee-management</code>
>
> 环境：JDK 21、Spring Boot 4.0.7。Boot 4 当前项目使用 <code>spring-boot-starter-aspectj</code>。

> [!summary] 快速复习
> - AOP 集中处理日志、事务等横跨多个业务的功能，避免每个方法复制同一段代码。
> - Spring AOP 通过代理拦截方法调用；调用必须经过代理，通知才会执行。
> - 当前项目用 <code>@LogOperation</code> 选择需要审计的方法，用 <code>@Around</code> 计时并记录成功或失败。
> - <code>joinPoint.proceed()</code> 才会执行目标方法；失败时切面应继续抛出原异常，保持原来的 HTTP 和全局异常处理语义。
> - 当前切面切在 Controller。Controller 调用的 Service 事务已经先提交或回滚，之后切面再通过 <code>OperateLogService</code> 的独立调用保存日志。
> - ObjectMapper 只是序列化工具，不会自动完成所有敏感字段脱敏；正式审计应使用 DTO、字段白名单和脱敏规则。
> - ThreadLocal 让每个线程拥有自己的值。线程池会复用线程，手写时必须在 <code>finally</code> 中 <code>remove()</code>。
> - 当前项目没有自建裸 ThreadLocal；当前用户来自 SecurityContextHolder，分页上下文由 PageHelper 管理。

## 1. AOP 解决什么问题

新增、修改和删除员工、班级、学生时，都可能需要记录：

- 操作人；
- 类名和方法名；
- 参数和结果；
- 成功或失败；
- 执行耗时。

如果每个 Controller 都手写计时和日志，会出现重复、漏记和职责混杂。AOP 把公共处理放到业务方法外面：

~~~text
调用者
  ↓
代理：执行切面前半部分
  ↓
目标方法：执行真正业务
  ↓
代理：执行切面后半部分
  ↓
调用者
~~~

> [!note]
> AOP 适合“多个模块都需要”的横切功能。员工能否删除、班级是否有学生等业务规则仍应放在 Service。

---

## 2. AOP 常用术语

| 术语 | 通俗理解 | 当前项目 |
|---|---|---|
| Target | 原本的业务对象 | <code>EmpController</code> |
| Join Point | 可能被增强的方法执行 | <code>save()</code>、<code>delete()</code> |
| Pointcut | 选择哪些方法 | 带 <code>@LogOperation</code> 的方法 |
| Advice | 实际增加的处理 | <code>around()</code> |
| Aspect | 切点和通知的组合 | <code>OperationLogAspect</code> |
| Proxy | 包在目标对象外面的对象 | Spring 创建的代理 Bean |

Boot 4.0.7 当前项目依赖：

~~~xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-aspectj</artifactId>
</dependency>
~~~

对象必须由 Spring 管理，Spring 才能参与代理。构造器注入的主要优势是依赖明确、可使用 <code>final</code>、易测试和避免半初始化对象；不能把它简单说成“确保一定生成 AOP 代理”，是否代理仍由切面匹配和 Spring 配置决定。

---

## 3. 当前项目的标记注解

~~~java
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
public @interface LogOperation {
}
~~~

- <code>@Target(METHOD)</code>：只能标在方法上；
- <code>@Retention(RUNTIME)</code>：运行时仍能读取；
- 注解本身只作标记，不会自动执行日志代码。

Controller 中的用法：

~~~java
@LogOperation
@PostMapping
public Result save(@RequestBody Emp emp) {
    empService.save(emp);
    return Result.success();
}
~~~

当前主要给会修改数据的新增、修改、删除方法添加注解。

---

## 4. @Around 与 proceed

切面核心结构：

~~~java
@Aspect
@Component
public class OperationLogAspect {

    @Around("@annotation(com.tanhong.anno.LogOperation)")
    public Object around(ProceedingJoinPoint joinPoint)
            throws Throwable {
        // 环绕目标方法
    }
}
~~~

操作日志需要同时取得耗时、返回值和异常，所以使用环绕通知：

~~~java
Object result = null;
Throwable failure = null;
long startNanos = System.nanoTime();

try {
    result = joinPoint.proceed();
    return result;
} catch (Throwable throwable) {
    failure = throwable;
    throw throwable;
} finally {
    long costTime = TimeUnit.NANOSECONDS.toMillis(
            System.nanoTime() - startNanos
    );
    saveOperationLog(joinPoint, result, failure, costTime);
}
~~~

<code>joinPoint.proceed()</code> 表示让调用链继续，最终执行真实 Controller 方法：

- 不调用：真实增删改不会执行；
- 调用多次：业务可能重复执行；
- 不返回原结果：调用者得不到原响应。

失败后继续抛出原异常，是为了保持“Controller 调用原本会产生的结果”：全局异常处理器仍能生成正确状态码和 JSON。

> [!important] 不要笼统理解为“当前 Service 事务靠 Controller 切面重新抛异常才回滚”
> 当前事务代理位于 Service。Service 方法抛出的异常会先穿过 Service 事务代理，事务在异常到达 Controller 切面之前已经决定回滚。切面若吞掉异常，主要会把 HTTP 失败伪装成成功。其他切点位置、代理嵌套顺序不同，事务影响也会不同，必须结合真实代理边界判断。

---

## 5. 当前真实事务与日志边界

一次成功操作大致是：

~~~mermaid
sequenceDiagram
    participant A as Controller AOP
    participant C as Controller
    participant T as Service事务代理
    participant S as Service
    participant L as OperateLogService事务

    A->>C: proceed
    C->>T: 调用业务方法
    T->>S: 开启并执行业务事务
    S-->>T: 正常返回
    T-->>C: 提交业务事务
    C-->>A: 返回Result
    A->>L: 保存操作日志
    L-->>A: 提交日志事务
~~~

失败时：

1. Service 抛出异常；
2. Service 事务代理先回滚；
3. 异常回到 Controller，再到 Controller 切面；
4. 切面在 <code>finally</code> 中尝试保存失败日志；
5. 切面继续抛出原异常；
6. 全局异常处理器生成响应。

<code>OperateLogService.save()</code> 自己带 <code>@Transactional</code>。由于它在 Controller 方法完成或失败后由切面调用，此时原 Service 事务通常已经结束，日志保存会开启自己的事务。

> [!warning] 哪些失败不会进入当前 Controller 切面
> 请求体绑定失败、参数反序列化失败、未认证、无权限、CSRF 校验失败等问题发生在 Controller 方法执行之前，因此不会触发标在 Controller 方法上的 <code>@LogOperation</code>。若要审计这些事件，应使用安全事件、Filter 或专门的访问日志机制。

---

## 6. 当前操作日志的数据流

~~~mermaid
flowchart LR
    A["OperationLogAspect"] --> B["CurrentUserProvider"]
    A --> C["OperateLogService"]
    B --> D["SecurityContextHolder"]
    C --> E["OperateLogMapper"]
    E --> F["operate_log表"]
~~~

| 类 | 职责 |
|---|---|
| <code>OperationLogAspect</code> | 采集操作、结果、异常和耗时 |
| <code>CurrentUserProvider</code> | 读取当前认证用户 |
| <code>OperateLogService</code> | 日志持久化入口和事务 |
| <code>OperateLogMapper</code> | 执行 INSERT |

切面不直接读取 Session，也不直接调用 Mapper，职责更清晰。

<code>CurrentUserProvider</code> 读取的是：

~~~java
Authentication authentication =
        SecurityContextHolder.getContext().getAuthentication();
~~~

当前用户来自 Authentication，不是 CSRF 令牌。

---

## 7. 序列化不等于自动脱敏

当前切面使用 Boot 配置的 ObjectMapper：

~~~java
objectMapper.writeValueAsString(value);
~~~

在 Spring Boot 4.0.7 / Jackson 3 中：

- ObjectMapper 是 <code>tools.jackson.databind.ObjectMapper</code>；
- <code>@JsonProperty</code> 注解仍是 <code>com.fasterxml.jackson.annotation.JsonProperty</code>。

<code>Emp.password</code> 使用 <code>WRITE_ONLY</code>，因此员工密码不会被序列化。但这只保护密码字段，不能把 ObjectMapper 生成的内容称为“安全 JSON”。

当前仍有待改进的风险：

- <code>Student.phone</code>、<code>Student.idCard</code>、<code>Student.address</code> 可能进入 AOP 参数日志；
- <code>StuController</code> 的新增、修改日志直接使用 <code>{}</code> 打印整个 Student，Lombok 的 <code>toString()</code> 可能输出这些字段；
- 其他对象以后新增敏感字段时，切面不会自动知道。

> [!danger] 正式方案
> 操作日志应使用专门审计 DTO、字段白名单和脱敏规则，只记录确实需要的数据。例如身份证仅保留前后少量字符、手机号中间隐藏，密码和令牌永不记录。不能只依靠实体注解或 ObjectMapper。

数据库字段有长度限制，参数和返回值还应截断，防止日志过长导致 INSERT 失败。

---

## 8. 审计表外键的边界

<code>operation-log-migration.sql</code> 中：

~~~sql
foreign key (operate_emp_id) references emp (id)
    on delete set null
~~~

优点是删除员工时不会因为历史日志引用而阻止删除；缺点是历史记录中的操作员工 ID 会被设为 null，只剩其他操作信息，身份关联丢失。

还有一个特殊情况：

1. 当前登录员工删除自己的 emp 记录；
2. 业务事务先提交；
3. Controller 切面随后用已删除的员工 ID 插入日志；
4. 外键校验失败，日志无法保存；
5. 当前切面捕获日志异常并记录 ERROR，主业务不会恢复。

可选改进：

- 禁止用户删除自己的登录账号；
- 在日志表保存用户名、显示名等身份快照，而不只保存外键；
- 将登录账号与员工业务资料拆成独立表；
- 强审计系统使用独立、不可随业务记录删除的主体标识。

> [!important]
> 强审计要求历史记录能独立说明“当时是谁操作”，不能只依赖一个未来可能被删除或改名的员工外键。

---

## 9. 日志保存失败与 WARN / ERROR

当前项目把数据库操作日志视为辅助能力：

~~~java
try {
    operateLogService.save(operateLog);
} catch (Exception logException) {
    log.error("保存操作日志失败", logException);
}
~~~

这样可避免“业务已经成功，审计表失败却向前端返回 500”。但强审计系统可能要求业务与审计一起成功，或通过可靠消息异步保存，这是业务决策。

| 级别 | 当前适用场景 |
|---|---|
| WARN | 内容序列化失败但已降级为占位文本，程序仍能继续 |
| ERROR | 操作日志完全无法持久化，审计能力已经丢失 |

同一个异常不要在每一层重复打印完整堆栈。密码、Session ID、CSRF、JWT、身份证等敏感数据不能进入普通日志或审计日志。

---

## 10. ThreadLocal 是什么

ThreadLocal 让每个线程保存自己的值：

~~~text
线程A → 用户10
线程B → 用户25
~~~

基本 API：

~~~java
private static final ThreadLocal<Integer> CURRENT_USER_ID =
        new ThreadLocal<>();

CURRENT_USER_ID.set(10);
Integer id = CURRENT_USER_ID.get();
CURRENT_USER_ID.remove();
~~~

| 方法 | 作用 |
|---|---|
| <code>set(value)</code> | 保存当前线程的值 |
| <code>get()</code> | 读取当前线程的值 |
| <code>remove()</code> | 清理当前线程的值 |

ThreadLocal 不是线程安全集合，它通过“每个线程各一份”避免共享。

---

## 11. 为什么必须清理

Web 服务器使用线程池：

~~~text
请求A使用http-1 → 结束
请求B再次使用http-1
~~~

请求 A 未清理的值可能被请求 B 读到，还会让线程长期引用对象。手写 ThreadLocal 时必须：

~~~java
try {
    CURRENT_USER_ID.set(userId);
    chain.doFilter(request, response);
} finally {
    CURRENT_USER_ID.remove();
}
~~~

ThreadLocal 也不会自动跨到 <code>CompletableFuture</code> 等异步线程。异步任务应显式传递必要数据，或使用框架提供的上下文传播工具。

---

## 12. 当前项目与 ThreadLocal

### 12.1 SecurityContextHolder

典型 Servlet 请求中，Spring Security 使用线程上下文保存当前 SecurityContext：

~~~text
过滤器从HttpSession恢复认证
  → 放入当前请求线程
  → CurrentUserProvider读取
  → 请求结束时由安全过滤器清理
~~~

HttpSession 跨多个请求保存登录状态；ThreadLocal 上下文主要服务当前请求，两者不能互相替代。

### 12.2 PageHelper

<code>PageHelper.startPage()</code> 把分页参数放入当前线程，下一条 MyBatis 查询读取并改写 SQL，所以必须紧邻查询：

~~~java
PageHelper.startPage(pageNum, pageSize);
List<Emp> list = empMapper.list(queryParam);
~~~

查询正常进入 PageHelper 拦截器时，插件会清理状态。如果 <code>startPage()</code> 后可能提前返回、抛出异常或在真正 Mapper 查询前走其他分支，应显式保证清理：

~~~java
try {
    PageHelper.startPage(pageNum, pageSize);
    if (shouldReturnEarly()) {
        return emptyResult();
    }
    return buildResult(empMapper.list(queryParam));
} finally {
    PageHelper.clearPage();
}
~~~

> [!warning]
> 最简单可靠的写法仍是让 <code>startPage()</code> 紧接目标 Mapper 查询，中间不加入可能提前退出的业务逻辑。

### 12.3 当前没有自建裸 ThreadLocal

当前用户由 <code>CurrentUserProvider</code> 读取框架管理的 SecurityContextHolder，分页由 PageHelper 管理。不要再复制一份自定义 <code>CurrentHolder</code>，否则可能产生两个不一致的“当前用户”。

---

## 13. 代理自调用

~~~java
public void outer() {
    this.inner();
}

@LogOperation
public void inner() {
}
~~~

<code>this.inner()</code> 是对象内部直接调用，通常绕过代理，因此 inner 的 AOP 不生效。<code>@Transactional</code> 也有相同代理限制。

优先把需要独立增强的方法拆到另一个 Spring Bean，再通过构造器注入调用，不要到处从 ApplicationContext 获取自己。

当前 <code>@LogOperation</code> 标在 Controller，Spring MVC 从容器取得 Controller 代理进行外部调用，因此正常请求能够触发切面。

---

## 14. 关键问答

### 加了 @LogOperation 为什么没效果？

检查 AOP starter、<code>@Aspect</code>、<code>@Component</code>、切点表达式、Spring Bean 身份，以及调用是否经过代理。

### 为什么日志记录后还要抛出原异常？

为了保留原本的 HTTP 失败和全局异常响应语义。事务是否受影响必须按切点位置和代理顺序分析；当前 Controller 切面看到异常前，Service 事务已经先处理它。

### ThreadLocal 能代替 Session 吗？

不能。ThreadLocal 面向当前线程任务；Session 跨多个请求保存会话。

### 为什么认证或 CSRF 失败没有操作日志？

这些失败发生在 Controller 执行前，不会进入当前 Controller 方法切面。

### 为什么不用自定义 CurrentHolder？

Spring Security 已负责建立和清理 SecurityContext，再维护一份容易泄漏或不一致。

---

## 15. 自检清单

- [ ] 能区分 Target、Pointcut、Advice、Aspect 和 Proxy 吗？
- [ ] 知道 <code>proceed()</code> 为什么必须执行并返回吗？
- [ ] 能描述 Controller 切面与 Service 事务的真实先后关系吗？
- [ ] 知道绑定、认证和 CSRF 失败不会进入当前切面吗？
- [ ] 知道 ObjectMapper 不等于自动脱敏吗？
- [ ] 能指出 Student 敏感字段和自删审计的当前风险吗？
- [ ] 能写出 ThreadLocal 的 <code>set/get/remove</code> 吗？
- [ ] 知道线程池为什么要求 <code>finally + remove()</code> 吗？
- [ ] 知道 PageHelper 为什么要紧邻查询吗？
- [ ] 能解释 <code>this.method()</code> 为什么可能绕过代理吗？

## 16. 一句话总结

> Spring AOP 通过代理把操作日志包围在 Controller 方法之外；当前 Service 事务先完成，再由切面单独保存审计日志。ThreadLocal 能隔离当前线程上下文，但必须正确清理，并且框架已管理的上下文不应重复手写。

## 导航

- 上一篇：[[8、登录认证与Spring Security：Session、Cookie、CSRF与BCrypt]]
- 下一篇：[[10、Bean进阶：作用域、第三方Bean与Import]]
- 相关：[[4、SpringBoot配置文件与日志]]
- 相关：[[6、分页查询与PageHelper]]
- 相关：[[7、Spring事务与传播行为]]
- 返回目录：[[0、SpringBoot笔记目录与学习路线]]
