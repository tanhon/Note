# MyBatis 知识点总结

## 本篇快速复习

- MyBatis 位于 Service 与数据库之间，通过 Mapper 代理执行 SQL、设置参数并封装结果。
- 简单 SQL 可以写注解；动态 SQL、多表查询和复杂结果映射更适合 XML。
- `#{}` 使用预编译参数，普通值优先使用；`${}` 是直接拼接，必须经过白名单校验。
- `resultType` 适合普通对象；字段不一致或存在一对多关系时使用 `resultMap`。
- `<where>`、`<set>`、`<foreach>` 分别处理动态条件、动态更新和集合遍历。
- `AUTO_INCREMENT` 负责生成主键，`useGeneratedKeys` 只负责把主键写回 Java 对象。
- 多条相关写操作由 Spring 在 Service 层管理事务，详见 [[7、Spring事务与传播行为]]。

> 入门案例：`D:\Springboot\Springboot-mybatis`，用于学习 `UserMapper` 和基础 CRUD。
>
> 当前案例：`D:\Springboot\employee-management`，使用 JDK 21、Spring Boot 4、MyBatis 与 MySQL。

---

## 1. MyBatis 是什么

MyBatis 是 Java 持久层框架，替我们完成 JDBC 中大量重复工作：

- 获取连接并执行 SQL。
- 给 SQL 设置参数。
- 遍历查询结果并转换为 Java 对象。
- 将 Mapper 方法与 SQL 建立映射。

```text
Controller → Service → Mapper代理 → MyBatis → MySQL
```

> [!important] MyBatis 不是什么
> 它不是数据库，不负责创建表，也不会替开发者决定业务规则。SQL 和事务边界仍需要开发者设计。

---

## 2. 当前多模块项目中的位置

```text
employee-web       Controller、启动类、application.yaml、MyBatis自动配置
      ↓
employee-service   Service、PageHelper、事务边界
      ↓
employee-dao       Mapper接口、Mapper XML
      ↓
employee-model     Emp、EmpExpr、Clazz、Student等对象
```

模块化改变的是文件位置和依赖边界，不改变三层调用顺序。

启动类统一扫描 Mapper：

```java
@MapperScan("com.tanhong.mapper")
@SpringBootApplication
public class EmployeeManagementApplication {
    public static void main(String[] args) {
        SpringApplication.run(EmployeeManagementApplication.class, args);
    }
}
```

使用 `@MapperScan` 后，每个 Mapper 接口不必再单独添加 `@Mapper`。

---

## 3. Mapper 接口为什么没有实现类

```java
public interface UserMapper {
    List<User> findAll();
    int deleteById(@Param("id") Integer id);
}
```

运行时，MyBatis 为接口创建代理对象：

1. 根据接口完整类名和方法名找到映射语句。
2. 设置参数并执行 SQL。
3. 将结果封装成返回类型。
4. 把代理对象作为 Bean 交给 Spring 注入。

因此 Service 可以使用构造器注入：

```java
private final UserMapper userMapper;

public UserServiceImpl(UserMapper userMapper) {
    this.userMapper = userMapper;
}
```

> [!note] 接口不是“自动写出了实现类”
> 真正工作的是运行时代理对象。它把“调用 Java 方法”转换成“执行映射 SQL”。

---

## 4. 注解 SQL 与 XML SQL

### 注解方式

```java
@Select("select id, username, name from user where id = #{id}")
User findById(@Param("id") Integer id);
```

常用注解：`@Select`、`@Insert`、`@Update`、`@Delete`。适合短小、固定的 SQL。

当前员工新增还使用了主键回填注解。下面为突出主键机制，省略了其他字段：

```java
@Options(useGeneratedKeys = true, keyProperty = "id")
@Insert("""
    insert into emp(username, name, create_time, update_time)
    values(#{username}, #{name}, #{createTime}, #{updateTime})
    """)
void insert(Emp emp);
```

### XML 方式

```xml
<select id="findAll" resultType="com.tanhong.pojo.User">
    select id, username, name from user order by id
</select>
```

XML 更适合动态条件、批量操作、联表查询和 `resultMap`。

> [!danger] 同一个方法只保留一份 SQL
> 不要同时给同一 Mapper 方法配置注解 SQL 和 XML SQL，否则会出现重复映射。

---

## 5. Mapper XML 的对应规则与位置

完整骨架：

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE mapper
        PUBLIC "-//mybatis.org//DTD Mapper 3.0//EN"
        "https://mybatis.org/dtd/mybatis-3-mapper.dtd">
<mapper namespace="com.tanhong.mapper.UserMapper">
    <select id="findAll" resultType="com.tanhong.pojo.User">
        select id, username, name from user
    </select>
</mapper>
```

必须对应：

| XML | Java |
|---|---|
| `namespace="com.tanhong.mapper.UserMapper"` | Mapper 接口完整类名 |
| `<select id="findAll">` | 方法名 `findAll()` |
| `resultType="...User"` | 一行结果封装成 `User` |

当前文件位置：

```text
employee-dao/
├─ src/main/java/com/tanhong/mapper/EmpMapper.java
└─ src/main/resources/com/tanhong/mapper/EmpMapper.xml
```

XML 在 DAO 模块的 JAR 中，Web 模块配置：

```yaml
mybatis:
  mapper-locations: classpath*:/com/tanhong/mapper/*.xml
```

> [!important] `classpath*:`
> 它会查找所有类路径位置，包括依赖模块的 JAR；当前多模块项目比只写 `classpath:` 更适合使用它。

---

## 6. CRUD、参数与返回值

Mapper：

```java
public interface UserMapper {
    User findById(@Param("id") Integer id);
    int insert(User user);
    int update(User user);
    int deleteById(@Param("id") Integer id);
}
```

XML：

```xml
<select id="findById" resultType="com.tanhong.pojo.User">
    select id, username, name, age
    from user
    where id = #{id}
</select>

<insert id="insert">
    insert into user(username, name, age)
    values(#{username}, #{name}, #{age})
</insert>

<update id="update">
    update user
    set username = #{username}, name = #{name}, age = #{age}
    where id = #{id}
</update>

<delete id="deleteById">
    delete from user where id = #{id}
</delete>
```

增、改、删建议返回影响行数：

```text
0 → 没有记录受到影响
1 → 成功处理一条记录
```

> [!danger] 更新和删除必须检查 `where`
> 缺少 `where` 可能修改或删除整张表。批量操作还应先判断 ID 集合是否为空。

### `@Param` 怎么用

它给 Mapper 参数起一个供 SQL 使用的名字：

```java
List<User> search(@Param("name") String name,
                  @Param("age") Integer age);
```

```xml
where name = #{name} and age = #{age}
```

常见规则：

| Mapper 参数 | XML 写法 |
|---|---|
| `@Param("id") Integer id` | `#{id}` |
| `@Param("user") User user` | `#{user.name}` |
| 单个 `User user`，没有 `@Param` | `#{name}` |
| `@Param("ids") List<Integer> ids` | `<foreach collection="ids">` |

注解必须导入：

```java
org.apache.ibatis.annotations.Param
```

---

## 7. `#{}` 与 `${}`

```sql
where id = #{id}
```

`#{}` 会转换成预编译占位符 `?`，自动处理类型和引号，并防止大部分 SQL 注入。

```sql
order by ${column}
```

`${}` 会把文本直接拼进 SQL。它只能用于无法使用占位符的表名、列名或排序方向，并且必须先做白名单校验。

```java
String safeColumn = switch (column) {
    case "id", "name", "entry_date" -> column;
    default -> "id";
};
```

> [!danger] 用户输入的普通值永远优先使用 `#{}`
> 不要把前端传来的姓名、ID、关键字直接放入 `${}`。

---

## 8. 自增主键：生成与回填是两回事

| 功能 | 负责者 | 写法 |
|---|---|---|
| 生成新 ID | MySQL 表结构 | `id int primary key auto_increment` |
| 把 ID 写回对象 | MyBatis | `useGeneratedKeys=true`、`keyProperty="id"` |

```sql
create table user (
    id int primary key auto_increment,
    username varchar(50) not null
);
```

```xml
<insert id="insert" useGeneratedKeys="true" keyProperty="id">
    insert into user(username) values(#{username})
</insert>
```

```java
userMapper.insert(user);
Integer newId = user.getId();
```

参数若声明为 `@Param("user") User user`，XML 通常使用 `keyProperty="user.id"`。

> [!warning] 常见误区
> `useGeneratedKeys` 不会把普通列变成自增列；`AUTO_INCREMENT` 也不写在普通 `insert` 中。

---

## 9. 动态 SQL

### 9.1 `<where>` 与 `<if>`

```xml
<select id="list" resultType="com.tanhong.pojo.Emp">
    select e.id, e.username, e.name, e.entry_date
    from emp e
    <where>
        <if test="name != null and name != ''">
            and e.name like concat('%', #{name}, '%')
        </if>
        <if test="gender != null">
            and e.gender = #{gender}
        </if>
        <if test="begin != null">
            and e.entry_date &gt;= #{begin}
        </if>
    </where>
    order by e.id
</select>
```

`<where>` 在存在条件时添加 `where`，并删除最前面的多余 `and/or`。

> [!warning] 它不会自动补连接词
> 可以让每个可选条件都以 `and` 开头；不能把条件之间的 `and` 全部省略，否则两个条件同时成立时 SQL 仍然错误。

类型判断：

```xml
<!-- String -->
<if test="name != null and name != ''">...</if>

<!-- Integer、LocalDate、LocalDateTime通常只判断null -->
<if test="gender != null">...</if>
<if test="begin != null">...</if>
```

不要对数字或日期写 `!= ''`。

### 9.2 `<set>` 动态更新

```xml
<update id="updateById">
    update emp
    <set>
        <if test="name != null and name != ''">name = #{name},</if>
        <if test="gender != null">gender = #{gender},</if>
        <if test="entryDate != null">entry_date = #{entryDate},</if>
        <if test="updateTime != null">update_time = #{updateTime},</if>
    </set>
    where id = #{id}
</update>
```

`<set>` 自动添加 `set` 并删除最后多余的逗号。

> [!note] 选择性更新的限制
> 条件为 `null` 时表示“不修改”，因此不能用同一写法表达“主动把字段改成 null”。若业务需要清空字段，应设计明确规则。

### 9.3 `<foreach>` 批量操作

批量删除：

```xml
<delete id="deleteByIds">
    delete from emp where id in
    <foreach collection="ids" item="id"
             open="(" close=")" separator=",">
        #{id}
    </foreach>
</delete>
```

批量插入工作经历：

```xml
<insert id="insertBatch">
    insert into emp_expr(emp_id, `begin`, `end`, company, job) values
    <foreach collection="exprList" item="expr" separator=",">
        (#{expr.empId}, #{expr.begin}, #{expr.end},
         #{expr.company}, #{expr.job})
    </foreach>
</insert>
```

> [!warning] 关键字列名
> `begin`、`end` 可能与数据库关键字冲突，示例使用反引号保护。更理想的表结构是改用 `begin_date`、`end_date` 等含义明确的列名；当前源码未加反引号，迁移数据库版本时应特别验证。

| 属性 | 含义 |
|---|---|
| `collection` | Mapper 集合参数名 |
| `item` | 每次循环的元素名 |
| `open/close` | 整段内容的开始与结束字符 |
| `separator` | 元素之间的分隔符 |

Service 要先设置外键，并避免空集合产生无效 SQL：

```java
if (!CollectionUtils.isEmpty(exprList)) {
    exprList.forEach(expr -> expr.setEmpId(emp.getId()));
    empExprMapper.insertBatch(exprList);
}
```

`CollectionUtils.isEmpty` 对 `null` 和空集合都会返回 `true`。

### 9.4 其他动态标签

| 标签 | 作用 |
|---|---|
| `<choose>/<when>/<otherwise>` | 多个分支中选择一个，类似 `if/else if/else` |
| `<sql>/<include>` | 定义并引用可复用 SQL 片段 |
| `<trim>` | 自定义前缀、后缀和需要删除的内容 |

XML 中的小于号写成 `&lt;`，或放在 CDATA 中。

---

## 10. 查询结果映射

### 10.1 `resultType`、别名与驼峰

列名与属性名一致时使用 `resultType`：

```xml
<select id="findAll" resultType="com.tanhong.pojo.User">
    select id, username, name from user
</select>
```

简单不一致可用 SQL 别名：

```sql
select user_name as userName from user
```

数据库下划线转 Java 驼峰：

```yaml
mybatis:
  configuration:
    map-underscore-to-camel-case: true
```

例如：

```text
entry_date → entryDate
dept_id    → deptId
```

`parameterType` 多数情况下可省略，MyBatis 会根据实际参数判断；`resultType` 与 `resultMap` 在同一查询中二选一。

### 10.2 `resultMap + collection` 封装工作经历

一个员工对应多条工作经历：

```text
Emp 1 ─── 多 EmpExpr
```

联表结果会重复员工列，需要 `resultMap` 把多行合并成一个 `Emp` 和一个 `exprList`：

```xml
<resultMap id="empResultMap" type="com.tanhong.pojo.Emp">
    <id column="id" property="id"/>
    <result column="username" property="username"/>
    <result column="dept_name" property="deptName"/>

    <collection property="exprList" ofType="com.tanhong.pojo.EmpExpr">
        <id column="ee_id" property="id"/>
        <result column="ee_emp_id" property="empId"/>
        <result column="ee_company" property="company"/>
        <result column="ee_job" property="job"/>
        <result column="ee_begin" property="begin"/>
        <result column="ee_end" property="end"/>
    </collection>
</resultMap>

<select id="getById" resultMap="empResultMap">
    select e.id, e.username,
           d.name as dept_name,
           ee.id as ee_id,
           ee.emp_id as ee_emp_id,
           ee.company as ee_company,
           ee.job as ee_job,
           ee.`begin` as ee_begin,
           ee.`end` as ee_end
    from emp e
    left join dept d on e.dept_id = d.id
    left join emp_expr ee on e.id = ee.emp_id
    where e.id = #{id}
</select>
```

> [!important] 父子 `<id>`
> 父级 `<id>` 用于合并同一员工，子级 `<id>` 用于区分不同经历。单个复杂对象使用 `<association>`，集合使用 `<collection>`；驼峰配置不能代替一对多映射。

---

## 11. 当前 Spring Boot 配置

配置位于 `employee-web/src/main/resources/application.yaml`。下面是推荐整理方式，不是当前源码原样复制：

```yaml
spring:
  datasource:
    driver-class-name: com.mysql.cj.jdbc.Driver
    url: jdbc:mysql://localhost:3306/tlias
    username: root
    password: "${DB_PASSWORD:123456}"

mybatis:
  mapper-locations: classpath*:/com/tanhong/mapper/*.xml
  configuration:
    map-underscore-to-camel-case: true
    # 仅用于学习和本地排错
    log-impl: org.apache.ibatis.logging.stdout.StdOutImpl
```

当前项目没有指定 Druid，使用 Spring Boot 默认的 HikariCP。正式环境不要把真实密码提交到 Git；配置详见 [[4、SpringBoot配置文件与日志]]。

> [!warning] 当前源码现状
> 当前 `application.yaml` 仍直接写着学习密码 `123456`；`${DB_PASSWORD:123456}` 是建议改造方式，正式环境应去掉真实默认密码。

---

## 12. MyBatis 与事务

MyBatis 执行每条 SQL，Spring 把同一 Service 业务中的多条 SQL 组织成一个事务：

```java
@Transactional
public void save(Emp emp) {
    empMapper.insert(emp);
    if (!CollectionUtils.isEmpty(emp.getExprList())) {
        emp.getExprList().forEach(expr -> expr.setEmpId(emp.getId()));
        empExprMapper.insertBatch(emp.getExprList());
    }
}
```

任何一步失败时，员工与经历应该一起回滚。回滚规则、代理失效和传播行为统一见 [[7、Spring事务与传播行为]]。

---

## 13. 当前项目常见问答

### Q1：新增成功后，为什么 `exprList` 是空或 `null`？

新增和查询是两套 SQL。`insertBatch` 只保存子表，详情查询仍需：

1. `left join emp_expr`。
2. 给子表列设置 `ee_` 别名。
3. 使用带 `<collection>` 的 `resultMap`。

若经历存在但 `empId` 为 `null`，检查：

```sql
ee.emp_id as ee_emp_id
```

```xml
<result column="ee_emp_id" property="empId"/>
```

### Q2：数据库中有部门，为什么 `deptName` 是 `null`？

依次检查：

- `emp.dept_id` 是否能关联到 `dept.id`。
- 是否执行了 `left join dept`。
- 别名是否为 `dept_name`。
- `resultMap` 是否包含 `column="dept_name" property="deptName"`。

驼峰配置只能转换列名，不能修复 JOIN 错误或补出没查询的列。

### Q3：前端不传时间，会自动使用当前时间吗？

不会，未传属性通常是 `null`。可在 Service 使用 `LocalDateTime.now()`、在 SQL 使用数据库时间函数，或给数据库列设置默认值。当前项目由 Service 设置 `createTime/updateTime`。

### Q4：为什么修改经历采用“全删再新增”？

这是全量覆盖方案：简单但写操作较多，适合经历较少的学习项目；正式项目可以比较新旧列表后增量更新。两种方案都必须放在同一事务中。

单个 ID 要传给批量方法时可以写：

```java
empExprMapper.deleteByEmpIds(List.of(emp.getId()));
```

### Q5：动态 `list()` 为什么主要用于分页？

Mapper 提供普通条件 SQL。先调用 `PageHelper.startPage()`，下一次 `list()` 会被分页；不调用就是普通查询，因此不必复制一份分页 SQL。详见 [[6、分页查询与PageHelper]]。

### Q6：字段为 `null` 都是驼峰失败吗？

不一定，还可能是 SQL 没查该列、别名与 `resultMap` 不一致、缺少 `<collection>`，或者 `Result.success(data)` 没把参数赋给 `data`。`toString()` 只是字符串，不能代替对象映射或 Jackson JSON 序列化。

---

## 14. 常见错误速查

| 现象 | 优先检查 |
|---|---|
| `Invalid bound statement` | XML 是否加载；`namespace`、`id` 是否对应 |
| `Parameter 'xxx' not found` | `@Param`、`#{}`、`collection` 名称是否一致 |
| `Unknown column` | 数据库列名是否正确，是否误写 Java 属性名 |
| 返回属性为 `null` | SELECT 列、别名、驼峰配置、`resultMap` |
| XML 解析失败 | 标签闭合；`<` 是否转义；DOCTYPE 是否正确 |

> [!warning] 安全与测试
> 不查询或返回密码字段；避免打印包含密码的整个对象；修改类测试不要连接生产数据库。MyBatis 二级缓存可能带来一致性问题，学习阶段不必开启。

---

## 15. 核心自检清单

- [ ] Mapper 是否被 `@Mapper` 或 `@MapperScan` 扫描？
- [ ] XML `namespace`、SQL `id` 是否与接口、方法对应？
- [ ] 多模块 XML 是否通过 `classpath*:` 加载？
- [ ] `@Param`、`#{}` 和 `<foreach collection>` 名称是否一致？
- [ ] 普通值是否使用 `#{}`，`${}` 是否经过白名单？
- [ ] `update/delete` 是否有正确的 `where`？
- [ ] 动态条件是否保留了必要的 `and`，日期与数字是否只判断 `null`？
- [ ] 一对多查询是否配置父、子 `<id>` 和 `<collection>`？
- [ ] 数据库列是否配置 `AUTO_INCREMENT`，MyBatis 是否回填主键？
- [ ] 多条关联写操作是否放进 Service 事务？
- [ ] SQL 和日志是否避免泄露密码？

---

## 16. 一句话总结

> MyBatis 用 Mapper 代理把 Java 方法映射成 SQL，用 `#{}` 安全传参，以动态标签组合 SQL，再用 `resultType/resultMap` 封装结果；当前多模块项目的 Mapper 与 XML 位于 DAO，自动配置位于 Web，关联写操作由 Service 事务保证完整性。

## 参考资料

- [MyBatis 3 官方文档](https://mybatis.org/mybatis-3/)
- [MyBatis Mapper XML](https://mybatis.org/mybatis-3/sqlmap-xml.html)
- [MyBatis 动态 SQL](https://mybatis.org/mybatis-3/dynamic-sql.html)
- [MyBatis Spring Boot Starter](https://mybatis.org/spring-boot-starter/mybatis-spring-boot-autoconfigure/)

---

## 导航

- [[0、SpringBoot笔记目录与学习路线|返回笔记目录]]
- [[4、SpringBoot配置文件与日志|下一篇：配置文件与日志]]
- [[6、分页查询与PageHelper|相关：分页查询]]
- [[7、Spring事务与传播行为|相关：事务]]
