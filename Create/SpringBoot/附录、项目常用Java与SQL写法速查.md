# 附录：项目常用 Java 与 SQL 写法速查

## 本篇快速复习

- `List.of(x)` 适合快速创建不可修改的小列表；`Arrays.asList(array)` 是数组的定长视图。
- `CollectionUtils.isEmpty(list)` 同时判断 `null` 和空集合。
- Lambda `forEach` 可以给每条工作经历设置相同的员工 ID。
- `PageResult<Emp>` 使用泛型保证类型安全，不要写原始类型 `new PageResult(...)`。
- 前端没传时间时字段通常为 `null`，当前时间必须显式使用 `LocalDateTime.now()`。
- `toString()` 是普通字符串；JSON 是 Jackson 根据对象字段生成的结构化数据。
- 数据库 `AUTO_INCREMENT` 负责生成 ID，MyBatis `useGeneratedKeys` 负责把 ID 写回对象。
- `<where>` 只会清理最前面的多余 `and/or`，不会自动给多个条件补连接词。

> [!note] 使用方式
> 这不是一篇新的主线课程，而是集中解释项目代码中经常看到、又容易忘记的小语法。

---

## 1. `List.of()`

```java
empExprMapper.deleteByEmpIds(List.of(emp.getId()));
```

Mapper 需要 `List<Integer>`，但当前只有一个员工 ID，所以把单个值包装成列表。

```text
emp.getId()            Integer
List.of(emp.getId())   List<Integer>
```

注意：

- 返回列表不能添加、删除或替换元素。
- 不允许包含 `null`。
- 适合 Java 9+；当前 JDK 21 可以使用。

---

## 2. `Arrays.asList()`

```java
List<Integer> ids = Arrays.asList(emp.getId());
```

它也能把一个或多个值变成列表，但返回的是基于数组的定长列表：

- 可以 `set()` 替换元素。
- 不能 `add()` 或 `remove()` 改变长度。
- 可以包含 `null`。

当前只有一个非空 ID 时，`List.of(emp.getId())` 更简洁。

> [!warning] 基本类型数组
> `Arrays.asList(new int[]{1, 2})` 得到的是“包含一个 `int[]` 的列表”，不是两个整数。使用 `Integer[]` 或 Stream 转换。

---

## 3. `CollectionUtils.isEmpty()`

```java
List<EmpExpr> exprList = emp.getExprList();

if (!CollectionUtils.isEmpty(exprList)) {
    // 集合不是 null，并且至少有一个元素
}
```

它相当于：

```java
if (exprList != null && !exprList.isEmpty()) {
}
```

前面的 `!` 表示取反，所以整句话是“工作经历列表不为空时才执行批量插入”。

---

## 4. Lambda `forEach`

```java
exprList.forEach(empExpr -> empExpr.setEmpId(empId));
```

等价于：

```java
for (EmpExpr empExpr : exprList) {
    empExpr.setEmpId(empId);
}
```

作用是把刚刚生成的员工主键写到每条工作经历的外键中：

```text
Emp.id → EmpExpr.empId
```

随后批量插入 `emp_expr` 表。

---

## 5. 泛型 `PageResult<Emp>`

推荐：

```java
return new PageResult<Emp>(total, rows);
```

Java 可以推断类型时进一步简写：

```java
return new PageResult<>(total, rows);
```

不推荐：

```java
return new PageResult(total, rows);
```

最后一种使用了原始类型，编译器无法完整检查集合元素类型，可能出现未经检查的警告。

---

## 6. `LocalDateTime.now()`

```java
LocalDateTime now = LocalDateTime.now();
emp.setCreateTime(now);
emp.setUpdateTime(now);
```

它取得的是应用服务器当前时区下的本地日期时间。

> **问：请求不传时间，会自动使用当前时间吗？**
>
> 不会。字段通常是 `null`，必须由 Service、SQL 函数或数据库默认值明确设置。

即使 Java 已赋值，也要确认 INSERT/UPDATE SQL 包含对应列：

```sql
insert into clazz (..., create_time, update_time)
values (..., #{createTime}, #{updateTime})
```

---

## 7. `Optional`

`Optional<T>` 表示“可能有一个值，也可能没有”。

```java
Optional<Integer> currentUserId = provider.getCurrentUserId();
```

常用写法：

```java
Integer id = currentUserId.orElse(null);
```

它适合方法返回值，用来明确表达“可能不存在”；不建议把所有实体字段都改成 `Optional`。

---

## 8. `toString()` 与 JSON

```java
emp.toString()
```

得到普通字符串，主要用于调试。格式不稳定，还可能包含密码。

Controller 直接返回对象：

```java
return Result.success(emp);
```

Spring MVC 使用 Jackson 生成 JSON，前端可以按字段访问：

```javascript
const empName = response.data.name;
```

> [!danger] 密码
> 不要通过 `toString()`、日志或响应返回密码。优先使用响应 DTO，并设置敏感字段的序列化保护。

---

## 9. 数据库自增主键与主键回填

建表时：

```sql
id int primary key auto_increment
```

数据库负责生成 ID。普通 INSERT 通常不写 `id`：

```sql
insert into emp(username, name)
values (#{username}, #{name})
```

MyBatis 负责写回对象：

```java
@Options(useGeneratedKeys = true, keyProperty = "id")
void insert(Emp emp);
```

```text
AUTO_INCREMENT   生成ID
useGeneratedKeys 取回ID
keyProperty      写到哪个Java属性
```

`AUTO_INCREMENT` 不写在普通 INSERT 语句中。

---

## 10. SQL JOIN 与别名

```sql
select e.*, d.name as deptName
from emp e
left join dept d on e.dept_id = d.id
```

- `e`、`d` 是表别名。
- `deptName` 是查询结果列别名。
- Java 属性必须有对应的 `deptName`。

如果写成：

```sql
d.name as dept_name
```

并开启下划线转驼峰，可以映射为 `deptName`。

但一对多的 `exprList` 不能只靠别名和驼峰，仍需要联表结果与 `<collection>`。

---

## 11. `<where>` 与 `and`

推荐统一写法：

```xml
<where>
    <if test="name != null and name != ''">
        and e.name like concat('%', #{name}, '%')
    </if>
    <if test="gender != null">
        and e.gender = #{gender}
    </if>
</where>
```

`<where>` 会：

1. 有条件时添加 `where`。
2. 删除最前面的多余 `and` 或 `or`。

它不会自动把两个条件连接起来。假如每个条件都不写 `and`，两个 `<if>` 同时成立时可能得到：

```sql
where 条件1 条件2
```

这是错误 SQL。

---

## 12. `<foreach>` 批量插入

```xml
<insert id="insertBatch">
    insert into emp_expr(emp_id, begin, end, company, job)
    values
    <foreach collection="exprList"
             item="expr"
             separator=",">
        (#{expr.empId}, #{expr.begin}, #{expr.end},
         #{expr.company}, #{expr.job})
    </foreach>
</insert>
```

| 属性 | 含义 |
|---|---|
| `collection` | 要遍历的集合参数名 |
| `item` | 当前这一项的临时名字 |
| `separator` | 每项之间插入的内容 |
| `#{expr.empId}` | 读取当前对象的属性 |

Mapper 参数名必须对应：

```java
void insertBatch(@Param("exprList") List<EmpExpr> exprList);
```

---

## 13. 动态 SQL 类型判断

字符串可以判断空串：

```xml
<if test="name != null and name != ''">
```

数字、日期只判断 `null`：

```xml
<if test="gender != null">
<if test="beginDate != null">
```

不推荐：

```xml
<if test="beginDate != null and beginDate != ''">
```

`LocalDate` 不是字符串，与 `''` 比较可能产生类型转换或 OGNL 错误。

---

## 14. 相关笔记

- MyBatis 语法：[[3、MyBatis知识点总结]]
- 分页：[[6、分页查询与PageHelper]]
- 事务：[[7、Spring事务与传播行为]]
- 项目排错：[[13、employee-management项目测试与故障排查]]
- [[0、SpringBoot笔记目录与学习路线|返回笔记目录]]
