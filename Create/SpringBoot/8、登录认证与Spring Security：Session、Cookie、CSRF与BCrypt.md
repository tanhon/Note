# 登录认证与 Spring Security：Session、Cookie、CSRF 与 BCrypt

> 配套项目：<code>D:\Springboot\employee-management</code>
>
> 环境：JDK 21、Spring Boot 4.0.7、Spring Security 7.x。当前项目使用 HttpSession 登录，不使用 JWT 登录。

> [!summary] 快速复习
> - **认证**回答“你是谁”，**授权**回答“你能做什么”。
> - 登录信息保存在服务器 HttpSession；浏览器 Cookie 主要保存用于找到 Session 的 <code>JSESSIONID</code>。
> - <code>POST /login</code> 由 Spring Security 过滤器处理，不经过自定义 Controller。
> - <code>EmpUserDetailsService</code> 查询账号，<code>PasswordEncoder.matches()</code> 校验 BCrypt 密码哈希。
> - BCrypt 是不可逆的密码哈希算法，不是令牌；CSRF 令牌用于保护非安全方法，也不是 JWT。
> - 未登录访问受保护接口通常返回 401；已登录但无权限或 CSRF 校验失败通常返回 403。
> - 正式配置应只白名单放行登录页等资源，最后使用 <code>anyRequest().authenticated()</code>，避免新接口漏保护。

## 1. 认证与授权

| 概念 | 解决的问题 | 当前案例 |
|---|---|---|
| 认证 Authentication | 你是谁？ | 用户名、密码登录 |
| 授权 Authorization | 你能做什么？ | 是否可以访问员工接口 |

当前项目主要完成了“登录后才能访问业务接口”。<code>LoginUserDetails</code> 暂时给所有用户固定的 <code>ROLE_USER</code>，还没有角色表和细粒度权限。

> [!warning] 当前尚未实现
> <code>LoginUserDetails</code> 的账号未过期、未锁定、凭证未过期、启用状态目前全部固定返回 <code>true</code>。项目也没有登录失败限速、连续失败锁定和验证码，不能把这些框架接口误写成已经实现的功能。

---

## 2. Cookie、HttpSession 与 JSESSIONID

### 2.1 三者关系

Cookie 是浏览器为网站保存的小数据。浏览器之后访问同一网站时，通常会自动携带：

~~~http
Cookie: JSESSIONID=ABC123...
~~~

HttpSession 是服务器保存会话数据的空间。JSESSIONID 通常只是找到该空间的编号：

~~~text
浏览器Cookie中的JSESSIONID
            ↓
服务器找到对应HttpSession
            ↓
Spring Security恢复登录认证信息
~~~

> [!important]
> JSESSIONID 不是用户名，也不直接等于完整用户对象。它像“服务器储物柜的钥匙编号”，泄漏后可能被他人冒用。

### 2.2 当前 Cookie 配置

~~~yaml
server:
  servlet:
    session:
      timeout: 30m
      cookie:
        http-only: true
        same-site: lax
        secure: false
~~~

| 配置 | 含义 |
|---|---|
| <code>timeout: 30m</code> | 连续 30 分钟无请求后 Session 过期 |
| <code>http-only: true</code> | JavaScript 不能读取 JSESSIONID |
| <code>same-site: lax</code> | 限制部分跨站请求自动携带 Cookie |
| <code>secure: false</code> | 便于本地 HTTP；生产 HTTPS 应改为 <code>true</code> |

HttpOnly 不会妨碍登录：JavaScript 不能读取 Cookie，但浏览器仍会按规则自动发送它。

---

## 3. 一次完整登录流程

~~~mermaid
sequenceDiagram
    participant B as 浏览器
    participant F as Security过滤器链
    participant U as EmpUserDetailsService
    participant S as EmpService
    participant DB as MySQL
    participant H as HttpSession

    B->>F: GET /auth/csrf
    F->>H: 创建或取得Session
    F-->>B: CSRF令牌 + JSESSIONID
    B->>F: POST /login + 表单参数 + CSRF + JSESSIONID
    F->>U: loadUserByUsername
    U->>S: findByUsername
    S->>DB: 查询员工账号
    DB-->>F: 员工信息和BCrypt哈希
    F->>F: PasswordEncoder.matches
    F->>H: 保存SecurityContext
    F-->>B: 登录成功JSON
    B->>F: GET /emps + JSESSIONID
    F->>H: 恢复SecurityContext
    F-->>B: 放行并返回数据
~~~

核心步骤：

1. 前端请求 <code>GET /auth/csrf</code>，取得 CSRF 令牌；这一步可能创建 Session。
2. 浏览器保存响应 Cookie 中的 JSESSIONID。
3. 前端发送表单格式的 <code>POST /login</code>，同时携带 JSESSIONID 和 CSRF 请求头。
4. Spring Security 调用 <code>EmpUserDetailsService</code>。
5. 调用链继续到 <code>EmpService → EmpMapper → emp</code> 表。
6. Spring Security 用 <code>matches()</code> 比较原密码与数据库哈希。
7. 成功后把 <code>Authentication</code> 放入 SecurityContext，并保存到 HttpSession。
8. 后续请求只需浏览器自动携带 JSESSIONID，不会反复提交密码。

---

## 4. 当前项目中的核心类

| 类 | 职责 |
|---|---|
| <code>SecurityConfig</code> | 登录、退出、公开地址、保护地址、Session 和 CSRF |
| <code>EmpUserDetailsService</code> | 按用户名查询员工 |
| <code>LoginUserDetails</code> | 适配 Spring Security 需要的用户结构 |
| <code>RestSecurityHandler</code> | 将安全结果转成统一 Result JSON |
| <code>AuthController</code> | 返回 CSRF 令牌和当前登录用户 |
| <code>CurrentUserProvider</code> | 从 SecurityContext 读取当前用户 |

### 4.1 SecurityFilterChain 核心片段

下面只展示授权、登录和退出的**核心片段**：

~~~java
@Bean
public SecurityFilterChain securityFilterChain(
        HttpSecurity http,
        RestSecurityHandler handler) throws Exception {

    http
        .authorizeHttpRequests(authorize -> authorize
            .requestMatchers(
                "/", "/index.html", "/login.html",
                "/css/**", "/js/**", "/images/**",
                "/favicon.ico", "/error", "/auth/csrf"
            ).permitAll()
            .requestMatchers(
                "/auth/me", "/emps/**", "/depts/**",
                "/clazzs/**", "/students/**", "/report/**"
            ).authenticated()
            .anyRequest().permitAll()
        )
        .formLogin(form -> form
            .loginPage("/login.html")
            .loginProcessingUrl("/login")
            .successHandler(handler)
            .failureHandler(handler)
        )
        .logout(logout -> logout
            .logoutUrl("/logout")
            .invalidateHttpSession(true)
            .deleteCookies("JSESSIONID")
            .logoutSuccessHandler(handler)
        );

    return http.build();
}
~~~

当前完整源码还配置了：

- <code>exceptionHandling</code>：401、403 返回统一 JSON；
- <code>SessionCreationPolicy.IF_REQUIRED</code>：需要时才创建 Session；
- 登录成功更换 Session ID：防止会话固定攻击；
- <code>HttpSessionCsrfTokenRepository</code>：显式把 CSRF 令牌与 Session 关联。

<code>/</code> 和 <code>/index.html</code> 只是可以匿名下载的页面外壳，不代表页面随后调用的 <code>/emps</code> 等数据接口可以匿名访问。

> [!danger] 当前授权规则的扩展风险
> 目前结尾是 <code>anyRequest().permitAll()</code>。以后新建业务接口却忘记加入 <code>authenticated()</code> 列表时，它会意外公开。正式项目更稳妥的规则是：只对白名单使用 <code>permitAll()</code>，最后写 <code>anyRequest().authenticated()</code>。

### 4.2 EmpUserDetailsService

~~~java
@Service
public class EmpUserDetailsService implements UserDetailsService {

    private final EmpService empService;

    public EmpUserDetailsService(EmpService empService) {
        this.empService = empService;
    }

    @Override
    public UserDetails loadUserByUsername(String username) {
        Emp emp = empService.findByUsername(username);
        if (emp == null) {
            throw new UsernameNotFoundException("登录用户不存在");
        }
        return new LoginUserDetails(
                emp.getId(), emp.getUsername(),
                emp.getPassword(), emp.getName()
        );
    }
}
~~~

安全层通过 Service 查询数据，没有直接调用 Mapper，仍保持：

~~~text
employee-web → employee-service → employee-dao → employee-model
~~~

### 4.3 LoginUserDetails

认证只需要用户 ID、用户名、密码哈希、显示名称和权限。单独创建 <code>LoginUserDetails</code>，避免把工资、电话等完整 <code>Emp</code> 放进 Session。

认证完成后，它通过 <code>eraseCredentials()</code> 清空对象中不再需要的密码哈希。

---

## 5. BCrypt 与数据库迁移

新增或重置密码时：

~~~java
emp.setPassword(passwordEncoder.encode(rawPassword));
~~~

登录时：

~~~java
passwordEncoder.matches(rawPassword, storedHash);
~~~

BCrypt 的特点：

- 不可逆，不能“解密”回原密码；
- 自带随机盐，同一密码多次编码结果通常不同；
- 必须用 <code>matches()</code>，不能直接用 <code>equals()</code>；
- 数据库和接口都不能保存或返回原始密码。

### 5.1 security-migration.sql 必须手工执行

项目中的 <code>database/security-migration.sql</code> 不会由 Spring Boot 自动执行，需要先备份数据库，再用 MySQL 客户端手工运行。它做两件事：

1. 将 <code>emp.password</code> 扩展为 <code>varchar(100)</code>；BCrypt 结果通常是 60 个字符。
2. 把历史明文 <code>123456</code> 替换为对应 BCrypt 哈希，使旧账号能够登录。

> [!danger] 学习脚本不等于正式迁移方案
> 给所有旧账号设置相同初始密码风险很高。正式系统应使用一次性重置流程，要求用户尽快设置不同的强密码，并记录迁移状态。

还应给登录名增加唯一约束：

~~~sql
alter table emp
    add constraint uk_emp_username unique (username);
~~~

执行前应先检查和清理重复用户名。

---

## 6. CSRF：它保护什么

浏览器会自动携带 Cookie，恶意网站可能诱导已登录浏览器向本系统发起修改请求。CSRF 防护要求请求再提供恶意网站难以取得的令牌。

~~~text
只有JSESSIONID          不够
JSESSIONID + 正确CSRF令牌 才允许修改
~~~

当前前端先请求 <code>GET /auth/csrf</code>，再把响应中的请求头名称和令牌放入修改请求：

~~~javascript
headers: {
    "Content-Type": "application/json",
    [csrf.headerName]: csrf.token
}
~~~

Spring Security 默认把 GET、HEAD、OPTIONS、TRACE 视为安全方法；POST、PUT、DELETE、PATCH 等非安全方法需要 CSRF 校验。

> [!warning]
> Session Cookie 登录不要为了方便调试直接关闭 CSRF。PATCH 同样会修改状态，也必须携带令牌。

---

## 7. 为什么登录使用表单编码

当前用户名密码登录过滤器默认读取表单参数：

~~~http
Content-Type: application/x-www-form-urlencoded;charset=UTF-8

username=zhangsan&password=Test1234
~~~

~~~javascript
const body = new URLSearchParams({ username, password });
await fetch("/login", {
    method: "POST",
    headers: {
        "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
        [csrf.headerName]: csrf.token
    },
    body: body.toString(),
    credentials: "same-origin"
});
~~~

普通业务 JSON 通常由 Controller 的 <code>@RequestBody</code> 接收。不是 Spring Security 不能接收 JSON，而是改成 JSON 登录需要自定义认证读取方式。

---

## 8. Session、CSRF 与 JWT 对比

| 内容 | 主要作用 | 当前项目 |
|---|---|---|
| HttpSession + JSESSIONID | 维持登录状态 | 使用 |
| CSRF 令牌 | 防止跨站伪造修改请求 | 使用 |
| BCrypt 哈希 | 安全保存和校验密码 | 使用 |
| JWT | 可携带认证声明的令牌格式 | 未使用 |

JWT 不天然更安全：放在自动携带的 Cookie 中仍需考虑 CSRF；放在 JavaScript 可读取的位置要重点防范 XSS；还要处理刷新、吊销、密钥和退出。

---

## 9. Filter、Interceptor、AOP 与安全过滤器链

~~~text
请求 → Servlet Filter → Spring Security Filter Chain
     → DispatcherServlet → HandlerInterceptor
     → Controller → Service → Mapper
~~~

| 对比 | Filter | HandlerInterceptor | Spring AOP |
|---|---|---|---|
| 执行边界 | Servlet 请求链 | Spring MVC Controller 前后 | 匹配到的 Spring Bean 方法前后 |
| 能否处理未进入 MVC 的请求 | 能 | 不能 | 不能 |
| 能否直接看到业务方法参数 | 通常不能 | 能识别 Handler，但不是围绕已绑定参数的方法调用 | 能通过连接点取得方法参数 |
| 是否依赖 Spring 方法代理 | 否 | 否 | 是 |
| 典型用途 | 安全、编码、请求包装 | MVC 登录检查、Controller 公共处理 | 事务、审计日志、统一计时 |

Spring Security 是一组过滤器，负责恢复 SecurityContext、CSRF 校验、登录认证和授权。当前项目没有再编写自定义登录拦截器。

选择口诀：**进入 MVC 之前的请求级处理用 Filter；只围绕 Controller 用 Interceptor；横跨多个 Spring Bean 方法的公共能力用 AOP。**三者执行边界不同，不是互相替代的三个名字。

---

## 10. 401、403 与安全异常

| 状态码 | 含义 | 例子 |
|---|---|---|
| 401 | 尚未认证 | 未登录访问 <code>/emps</code> |
| 403 | 请求不允许执行 | 无权限或 CSRF 校验失败 |

<code>RestSecurityHandler</code>处理登录成功、登录失败、未登录、无权限和退出。安全异常大多发生在 Controller 之前，普通 <code>@RestControllerAdvice</code> 不一定能捕获，应由 <code>AuthenticationEntryPoint</code>、<code>AccessDeniedHandler</code> 等安全组件转换响应。

登录失败统一返回“用户名或密码错误”，避免泄露用户名是否存在。

---

## 11. 关键问答

### BCrypt 是令牌吗？

不是。它是密码哈希算法；维持登录的是 Session 与 JSESSIONID。

### CSRF 令牌能代表用户身份吗？

不能。它只提供请求防伪信息，用户身份来自 Authentication。

### 为什么 GET 成功，POST 返回 403？

常见原因是 POST 缺少正确 CSRF 令牌。认证和 CSRF 是两道检查。

### 为什么向 /login 发送 JSON 失败？

当前登录过滤器默认读取表单参数，不读取 JSON 请求体。

### Session 过期会怎样？

服务器无法恢复登录状态，受保护接口返回 401，前端应跳转登录页。

---

## 12. 最重要的安全提醒

> [!danger]
> - 正式环境必须使用 HTTPS，并启用 Secure Cookie。
> - 不保存明文密码，不输出密码哈希，不记录 JSESSIONID、CSRF 或 JWT。
> - CORS 与 CSRF 解决不同问题，配置 CORS 不等于已防 CSRF。
> - 当前固定 ROLE_USER、账号状态固定 true、无登录限速，只适合学习阶段。
> - 正式授权应使用公开资源白名单，剩余请求默认要求认证。

## 13. 自检

- [ ] 能区分认证和授权吗？
- [ ] 能说明 Cookie、Session、JSESSIONID 的关系吗？
- [ ] 知道 <code>/login</code> 为什么不经过 Controller 吗？
- [ ] 能区分 BCrypt、CSRF 和 JWT 吗？
- [ ] 能解释 401 与 403吗？
- [ ] 知道哪些 HTTP 方法默认需要 CSRF 保护吗？
- [ ] 知道当前账号锁定与失败限速尚未实现吗？
- [ ] 知道迁移脚本为什么必须手工执行吗？

## 14. 一句话总结

> 当前项目由 Spring Security 过滤器完成认证，把 SecurityContext 保存在 HttpSession 中，由 JSESSIONID 维持会话；BCrypt 负责密码哈希，CSRF 负责保护非安全方法，它们不能相互替代。

## 导航

- 上一篇：[[7、Spring事务与传播行为]]
- 下一篇：[[9、Spring AOP、操作日志与ThreadLocal]]
- 相关：[[1、SpringBoot项目创建与HTTP请求响应]]
- 相关：[[5、Web接口工程化基础：DTO、校验、异常与跨域]]
- 相关：[[10、Bean进阶：作用域、第三方Bean与Import]]
- 返回目录：[[0、SpringBoot笔记目录与学习路线]]
