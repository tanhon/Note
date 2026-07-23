> 配套项目：`D:\Springboot\Springboot-mybatis`  
> 技术环境：JDK 21、Spring Boot 4、MyBatis、MySQL、Druid

---

## 1. MyBatis 是什么

MyBatis 是一个 Java 持久层框架，主要负责：

- 执行 SQL。
- 给 SQL 设置参数。
- 将查询结果转换成 Java 对象。
- 将 Mapper 接口方法与 SQL 建立映射。

它简化了 JDBC 中创建连接、创建 `PreparedStatement`、遍历 `ResultSet` 等重复代码，但 SQL 通常仍由开发者编写。

```text
Controller
    ↓
Service
    ↓
Mapper 接口
    ↓
MyBatis
    ↓
数据库
```

> **注意：** MyBatis 不负责创建数据库和数据表，也不是数据库。它是 Java 程序与数据库之间的数据访问工具。

---

## 2. 项目中的核心组成

当前项目的主要文件：

```text
Springboot-mybatis
├─ src/main/java/com/tanhong
│  ├─ SpringbootMybatisApplication.java
│  ├─ mapper
│  │  └─ UserMapper.java
│  └─ pojo
│     └─ User.java
│
├─ src/main/resources
│  ├─ application.yml
│  └─ com/tanhong/mapper
│     └─ UserMapper.xml
│
└─ src/test/java/com/tanhong/springbootmybatis
   └─ SpringbootMybatisApplicationTests.java
```

各部分职责：

| 组成 | 作用 |
|---|---|
| `User` | 保存一条用户记录 |
| `UserMapper` | 定义数据库操作方法 |
| `UserMapper.xml` | 编写 SQL 和结果映射 |
| `application.yml` | 配置数据源和连接池 |
| MyBatis Starter | 自动配置 MyBatis 与 Spring |
| MySQL Driver | 连接 MySQL |
| Druid | 提供数据库连接池 |

---

## 3. Mapper 接口与代理对象

Mapper 接口只定义数据库操作，不需要手写实现类：

```java
@Mapper
public interface UserMapper {

    List<User> findAll();

    Integer deleteById(@Param("id") Integer id);
}
```

`@Mapper` 的作用：

1. 告诉 MyBatis 这是一个 Mapper 接口。
2. MyBatis 在运行时创建代理对象。
3. 代理对象根据方法找到对应 SQL。
4. 执行 SQL 并返回结果。
5. 代理对象作为 Bean 交给 Spring 管理。

因此可以直接注入：

```java
@Autowired
private UserMapper userMapper;
```

也可以在启动类统一扫描：

```java
@MapperScan("com.tanhong.mapper")
@SpringBootApplication
public class SpringbootMybatisApplication {
}
```

使用 `@MapperScan` 后，Mapper 接口可以不逐个添加 `@Mapper`。

> **注意：** `UserMapper` 是接口，真正执行方法的是 MyBatis 创建的代理对象，不是 Java 自动生成的普通实现类。

---

## 4. SQL 的两种写法

### 4.1 注解方式

SQL 直接写在 Mapper 接口上：

```java
@Select("select * from user")
List<User> findAll();
```

常见注解：

| 注解 | 作用 |
|---|---|
| `@Select` | 查询 |
| `@Insert` | 新增 |
| `@Update` | 修改 |
| `@Delete` | 删除 |

适合简单、短小的 SQL。

### 4.2 XML 方式

Mapper 接口：

```java
List<User> findAll();
```

XML：

```xml
<select id="findAll" resultType="com.tanhong.pojo.User">
    select * from user
</select>
```

适合复杂 SQL、动态查询和多表映射。

> **注意：** 同一个 Mapper 方法不要同时使用注解 SQL 和 XML SQL，否则会出现语句重复映射问题。两种方式选择一种即可。

---

## 5. Mapper XML 的对应规则

当前 XML：

```xml
<mapper namespace="com.tanhong.mapper.UserMapper">

    <select id="findAll"
            resultType="com.tanhong.pojo.User">
        select * from user
    </select>

</mapper>
```

必须满足：

### 5.1 `namespace` 对应接口完整类名

```xml
namespace="com.tanhong.mapper.UserMapper"
```

对应：

```java
package com.tanhong.mapper;

public interface UserMapper {
}
```

### 5.2 SQL 的 `id` 对应方法名

```xml
<select id="findAll">
```

对应：

```java
List<User> findAll();
```

### 5.3 `resultType` 对应返回对象

```xml
resultType="com.tanhong.pojo.User"
```

表示将一行查询结果转换成一个 `User` 对象。

> **注意：** `namespace` 或 `id` 错误时，常见异常是 `Invalid bound statement (not found)`。

---

## 6. XML 文件放在哪里

当前项目将 XML 放在：

```text
src/main/resources/com/tanhong/mapper/UserMapper.xml
```

这个路径与 Mapper 接口包路径一致：

```text
com/tanhong/mapper/UserMapper.java
com/tanhong/mapper/UserMapper.xml
```

MyBatis 可以按接口路径找到 XML。

也可以统一放到：

```text
src/main/resources/mapper/UserMapper.xml
```

此时建议配置：

```yaml
mybatis:
  mapper-locations: "classpath:mapper/*.xml"
```

> **注意：** Mapper XML 应放在 `resources` 下，不要放在 `static`、`templates` 或普通 Java 源码目录。

---

## 7. 基本 CRUD

### 7.1 查询

```java
@Select("select * from user where id = #{id}")
User findById(@Param("id") Integer id);
```

XML：

```xml
<select id="findById"
        resultType="com.tanhong.pojo.User">
    select id, username, password, name, age
    from user
    where id = #{id}
</select>
```

### 7.2 新增

```java
@Insert("""
    insert into user(username, password, name, age)
    values(
        #{user.username},
        #{user.password},
        #{user.name},
        #{user.age}
    )
    """)
int insert(@Param("user") User user);
```

### 7.3 修改

单个对象参数可以直接使用对象属性：

```java
@Update("""
    update user
    set username = #{username},
        password = #{password},
        name = #{name},
        age = #{age}
    where id = #{id}
    """)
int update(User user);
```

### 7.4 删除

```java
@Delete("delete from user where id = #{id}")
int deleteById(@Param("id") Integer id);
```

增、改、删方法建议返回 `int`，表示受影响行数：

```text
0 → 没有记录受到影响
1 → 成功处理一条记录
```

> **注意：** `update` 和 `delete` 必须仔细检查 `where` 条件，否则可能修改或删除整张表。

---

## 8. `@Param` 参数命名

`@Param` 给 Mapper 方法参数定义一个可供 SQL 使用的名字。

```java
User findByNameAndAge(
        @Param("name") String name,
        @Param("age") Integer age
);
```

SQL：

```sql
where name = #{name}
  and age = #{age}
```

对应关系：

```text
@Param("name") → #{name}
@Param("age")  → #{age}
```

对象参数：

```java
int insert(@Param("user") User user);
```

需要通过参数名访问属性：

```text
#{user.username}
#{user.password}
#{user.name}
#{user.age}
```

单个对象不加 `@Param`：

```java
int update(User user);
```

可以直接写：

```text
#{id}
#{username}
#{password}
#{name}
#{age}
```

> **注意：** `@Param("user")` 和 `#{user.name}` 的名字必须一致。导入的注解必须是 `org.apache.ibatis.annotations.Param`。

---

## 9. `#{}` 与 `${}`

### 9.1 `#{}`：预编译参数

```sql
where id = #{id}
```

MyBatis 会使用类似 JDBC `PreparedStatement` 的占位参数：

```sql
where id = ?
```

优点：

- 自动处理参数类型。
- 自动处理字符串引号。
- 可以防止大部分 SQL 注入。

### 9.2 `${}`：直接字符串替换

```sql
order by ${column}
```

`${}` 会将字符串直接拼入 SQL，存在 SQL 注入风险。

> **特别注意：** 普通查询条件和值必须优先使用 `#{}`。`${}` 只适合经过白名单校验的表名、列名或排序字段。

---

## 10. 参数类型与返回结果

### 10.1 `parameterType`

XML 可以声明参数类型：

```xml
<select id="findById"
        parameterType="java.lang.Integer"
        resultType="com.tanhong.pojo.User">
    select * from user where id = #{id}
</select>
```

多数情况下 MyBatis 可以自动判断，`parameterType` 可以省略。

### 10.2 `resultType`

字段名和 Java 属性名一致时：

```xml
<select id="findAll"
        resultType="com.tanhong.pojo.User">
    select id, username, password, name, age
    from user
</select>
```

### 10.3 `resultMap`

字段名与属性名不一致时，解决办法：
<font color="#e36c09">1、可以手动映射：</font>

```xml
<resultMap id="userResultMap"
           type="com.tanhong.pojo.User">
    <!-- column 是数据库列名，property 是 Java 属性名 -->
    <id property="id" column="user_id"/>
    <result property="username" column="user_name"/>
    <result property="password" column="user_password"/>
    <result property="name" column="real_name"/>
    <result property="age" column="user_age"/>
</resultMap>
```

然后，在查询中引用：

```xml
<select id="findAll" resultMap="userResultMap">
    select user_id,
           user_name,
           user_password,
           real_name,
           user_age
    from user
</select>
```

<font color="#e36c09">2、也可以使用 SQL 别名：</font>

```SQL
<select id="findAll" resultType="com.tanhong.pojo.User">
    select user_id   as id,
           user_name as username,
           user_password as password,
           real_name as name,
           user_age  as age
    from user
</select>
```


---

## 11. 驼峰映射
<font color="#e36c09">3、数据库通常使用下划线：</font>

```text
user_name
```

Java 通常使用驼峰：

```text
userName
```

可以在 `application.yml` 中开启：

```yaml
mybatis:
  configuration:
    map-underscore-to-camel-case: true
```

开启后，自动映射：

```text
user_name → userName
```

当前 `User` 字段与数据库列名基本一致，因此暂时不依赖该配置。

---

## 12. 获取新增数据的自增主键

插入一条数据后，数据库会自动生成一个主键 ID（自增），但 Java 对象里还没这个 ID，怎么拿回来？

XML：

```xml
<insert id="insert"
        useGeneratedKeys="true"   <!-- 开启自动获取主键 -->
        keyProperty="id">		  <!-- 把主键值赋给该属性 -->
    insert into user(username, password, name, age)
    values(
        #{username},
        #{password},
        #{name},
        #{age}
    )
</insert>
```

执行：

```java
User user = new User();
userMapper.insert(user);
Integer id = user.getId();
```

插入成功后，数据库生成的主键会写回 `user.id`。

如果参数使用了 `@Param("user")`，XML 中通常写：

```xml
keyProperty="user.id"
```

---

## 13. 动态 SQL

动态 SQL 主要用于根据参数决定 SQL 片段。

### 13.1 `<if>`

```xml
<if test="name != null and name != ''">
    and name like concat('%', #{name}, '%')
</if>
```

### 13.2 `<where>`

```xml
<select id="search"
        resultType="com.tanhong.pojo.User">
    select * from user
    <where>
        <if test="name != null and name != ''">
            and name like concat('%', #{name}, '%')
        </if>
        <if test="age != null">
            and age = #{age}
        </if>
    </where>
</select>
```

`<where>` 会在有条件时添加 `where`，并处理开头多余的 `and` 或 `or`。

### 13.3 `<set>`

```xml
<update id="updateSelective">
    update user
    <set>
        <if test="username != null">
            username = #{username},
        </if>
        <if test="name != null">
            name = #{name},
        </if>
        <if test="age != null">
            age = #{age},
        </if>
    </set>
    where id = #{id}
</update>
```

`<set>` 会添加 `set` 并处理末尾多余的逗号。

### 13.4 `<foreach>`

```java
List<User> findByIds(
        @Param("ids") List<Integer> ids
);
```

```xml
<select id="findByIds"
        resultType="com.tanhong.pojo.User">
    select * from user
    where id in
    <foreach collection="ids"
             item="id"
             open="("
             separator=","
             close=")">
        #{id}
    </foreach>
</select>
```

### 13.5 `<choose>`

类似 Java 的 `switch`：

```xml
<choose>
    <when test="username != null">
        and username = #{username}
    </when>
    <when test="name != null">
        and name = #{name}
    </when>
    <otherwise>
        and age >= 18
    </otherwise>
</choose>
```

---

## 14. XML 常用标签

| 标签 | 作用 |
|---|---|
| `<mapper>` | Mapper XML 根标签 |
| `<select>` | 查询 |
| `<insert>` | 新增 |
| `<update>` | 修改 |
| `<delete>` | 删除 |
| `<resultMap>` | 自定义结果映射 |
| `<sql>` | 定义可复用 SQL 片段 |
| `<include>` | 引用 SQL 片段 |
| `<if>` | 条件判断 |
| `<where>` | 动态生成 `where` |
| `<set>` | 动态生成 `set` |
| `<foreach>` | 遍历集合 |
| `<choose>` | 多分支选择 |
| `<trim>` | 自定义前后缀处理 |

XML 中小于号需要转义：

```xml
age &lt; #{age}
```

或者使用 CDATA：

```xml
<![CDATA[
    age < #{age}
]]>
```

---

## 15. Spring Boot 配置

当前数据源配置：

```properties
spring.application.name=Springboot-mybatis  
#使用的是Druid（德鲁伊）数据库连接池，默认是Hikari（追光者）  
spring.datasource.type=com.alibaba.druid.pool.DruidDataSource  
#数据库访问的url地址  
spring.datasource.url=jdbc:mysql://localhost:3306/jdbctest  
#数据库驱动类类名  
spring.datasource.driver-class-name=com.mysql.cj.jdbc.Driver  
#访问数据库-用户名  
spring.datasource.username=root  
#访问数据库-密码  
spring.datasource.password=123456
```

实际项目采用 yml 配置：

```yaml
spring:  
  datasource:    
  	type: com.alibaba.druid.pool.DruidDataSource  
    driver-class-name: com.mysql.cj.jdbc.Driver  
    url: jdbc:mysql://localhost:3306/jdbctest  
    username: root  
    password: "123456"  
    druid:  
      # Druid 专有配置  
      initial-size: 5  
      min-idle: 5  
      max-active: 20  
      stat-view-servlet:  
        enabled: true  # 开启监控
```

常见 MyBatis 配置：

```yaml
mybatis:
  mapper-locations: "classpath:mapper/*.xml"
  type-aliases-package: com.tanhong.pojo
  configuration:
    map-underscore-to-camel-case: true
    log-impl: org.apache.ibatis.logging.stdout.StdOutImpl
```

说明：

| 配置 | 作用 |
|---|---|
| `mapper-locations` | 指定 Mapper XML 路径 |
| `type-aliases-package` | 扫描类型别名 |
| `map-underscore-to-camel-case` | 开启下划线转驼峰 |
| `log-impl` | 输出 SQL 日志，适合学习和调试 |

> **注意：** 当前 XML 与 Mapper 接口使用相同类路径，因此不一定需要额外配置 `mapper-locations`。如果移动到统一的 `resources/mapper` 目录，就需要正确配置路径。

---

## 16. 事务

多个数据库操作必须作为一个整体成功或失败时，需要事务：

```java
@Transactional
public void transferData() {
    userMapper.update(...);
    userMapper.insert(...);
}
```

事务通常放在 Service 层，而不是 Mapper 层。

默认情况下，Spring 主要对运行时异常进行回滚。

需要检查型异常也回滚时：

```java
@Transactional(rollbackFor = Exception.class)
```

> **注意：** 不要在同一个类中通过 `this.method()` 调用带事务的方法并期望代理生效；事务依赖 Spring 代理。

---

## 17. 缓存

MyBatis 有两级缓存概念：

- 一级缓存：`SqlSession` 范围，默认存在。
- 二级缓存：Mapper namespace 范围，需要额外配置。

数据发生修改后，相关缓存通常会被清理。

学习初期应先掌握 CRUD、映射和动态 SQL，不建议过早开启二级缓存。

> **注意：** 缓存可能带来数据一致性问题。正式项目不能只为了“提高性能”就盲目启用。

---

## 18. 测试注意事项

当前测试中包含：

```text
查询
删除
新增
修改
```

除查询外，其他测试都会真实修改 `jdbctest` 数据库。

可以在测试类或测试方法上添加：

```java
@Transactional
```

Spring 测试通常会在测试结束后回滚事务。

也可以使用专门的测试数据库，避免影响开发数据。

> **特别注意：** 删除、修改测试不要直接连接生产数据库。

---

## 19. 当前项目需要特别注意

### 19.1 不要打印明文密码

当前 `User` 使用 Lombok `@Data`，生成的 `toString()` 会包含 `password`。

下面的代码会把密码打印到控制台：

```java
System.out.println(user);
```

正式项目应隐藏密码字段，密码也不能以明文保存。

### 19.2 SQL 注解和 XML 不要重复

当前 `findAll()` 使用 XML，接口中的 `@Select` 已注释，这是正确方向。

### 19.3 增删改建议返回影响行数

当前 `insert()` 和 `update()` 返回 `void`，建议改成：

```java
int insert(User user);
int update(User user);
```

便于判断操作是否成功。

### 19.4 配置文件不要提交真实密码

```yaml
password: "123456"
```

学习项目可以暂时使用，正式项目推荐：

```yaml
password: "${DB_PASSWORD}"
```

### 19.5 使用构造器注入

正式业务代码中推荐：

```java
private final UserMapper userMapper;

public UserServiceImpl(UserMapper userMapper) {
    this.userMapper = userMapper;
}
```

不推荐大量使用字段注入。

---

## 20. 常见异常排查

### `Invalid bound statement (not found)`

检查：

- XML 是否被加载。
- `namespace` 是否等于 Mapper 完整类名。
- SQL 标签 `id` 是否等于方法名。
- `mapper-locations` 是否正确。

### `Parameter 'xxx' not found`

检查：

- `@Param("xxx")` 与 `#{xxx}` 是否一致。
- 对象参数是否应该写成 `#{user.name}`。
- `<foreach collection="xxx">` 名字是否一致。

### `Unknown column`

检查：

- SQL 字段名是否正确。
- 数据库表结构是否正确。
- 是否把 Java 属性名误当成数据库列名。

### 返回对象字段为 `null`

检查：

- 数据库列名和 Java 属性名是否一致。
- 是否需要 SQL 别名。
- 是否需要 `resultMap`。
- 是否需要开启下划线转驼峰。

### XML 解析错误

检查：

- 标签是否闭合。
- `<` 是否写成 `&lt;` 或 CDATA。
- XML 头和 `DOCTYPE` 是否正确。

---

## 21. 学习顺序

建议按照以下顺序学习：

1. 数据源和 MySQL 连接。
2. `@Mapper` 与 Mapper 代理。
3. `select`、`insert`、`update`、`delete`。
4. `@Param` 和 `#{}`。
5. Mapper XML 的 `namespace`、`id`、`resultType`。
6. `resultMap`。
7. 动态 SQL。
8. Service 层事务。
9. 分页、批量操作和多表查询。
10. 缓存与性能优化。

---

## 22. 核心自检清单

- [ ] Mapper 接口是否有 `@Mapper`，或启动类是否有 `@MapperScan`？
- [ ] XML `namespace` 是否等于 Mapper 接口完整类名？
- [ ] XML SQL 的 `id` 是否等于 Mapper 方法名？
- [ ] `@Param` 名称是否与 `#{}` 一致？
- [ ] 普通值是否使用 `#{}`，避免使用 `${}`？
- [ ] 查询结果能否正确映射到 Java 属性？
- [ ] 注解 SQL 和 XML SQL 是否避免重复？
- [ ] 增删改是否检查了影响行数？
- [ ] `update`、`delete` 是否有正确的 `where` 条件？
- [ ] 多个操作是否需要放入 Service 事务？
- [ ] 测试是否会修改真实数据库数据？
- [ ] 密码等敏感信息是否避免写入日志和代码仓库？

---

## 23. 一句话总结

> MyBatis 通过 Mapper 接口和注解/XML 将 Java 方法映射为 SQL，使用 `#{}` 安全传参，通过 `resultType` 或 `resultMap` 将数据库记录转换成 Java 对象；在 Spring Boot 中，Mapper 由 MyBatis 生成代理并交给 Spring 管理，事务通常放在 Service 层。

---

## 参考资料

- [MyBatis 3 官方文档](https://mybatis.org/mybatis-3/)
- [MyBatis Mapper XML](https://mybatis.org/mybatis-3/sqlmap-xml.html)
- [MyBatis 动态 SQL](https://mybatis.org/mybatis-3/dynamic-sql.html)
- [MyBatis Spring Boot Starter](https://mybatis.org/spring-boot-starter/mybatis-spring-boot-autoconfigure/)
