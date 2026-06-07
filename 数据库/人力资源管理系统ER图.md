---
tags:
  - 数据库
  - ER图
  - 人力资源管理系统
created: 2026-06-07
---

# 人力资源管理系统 ER 图

```mermaid
erDiagram
    departments {
        int id PK "自增主键"
        string name "部门名称(唯一)"
    }

    employees {
        int id PK "自增主键"
        string employee_no "工号(唯一)"
        string name "姓名"
        string gender "性别"
        int department_id FK "所属部门"
        string position "职位"
        string phone "电话"
        string email "邮箱"
        string hire_date "入职日期"
        string status "状态(在职/离职)"
        timestamp created_at "创建时间"
        timestamp updated_at "更新时间"
    }

    users {
        int id PK "自增主键"
        string username "用户名(唯一)"
        string password "密码(bcrypt)"
        string role "角色(admin/manager/employee)"
        int department_id FK "所属部门(可空)"
        int employee_id FK "关联员工(可空)"
        timestamp created_at "创建时间"
    }

    announcements {
        int id PK "自增主键"
        string title "标题"
        string content "内容"
        int department_id FK "发布部门"
        string category "分类(通知/招聘/活动/项目/其他)"
        int created_by FK "发布者"
        timestamp created_at "创建时间"
        timestamp updated_at "更新时间"
    }

    departments ||--o{ employees : "1:N 拥有"
    departments ||--o{ users : "1:N 归属"
    departments ||--o{ announcements : "1:N 发布"
    employees ||--o| users : "1:0..1 关联"
    users ||--o{ announcements : "1:N 创建"
```

## 关系说明

| 关系 | 基数 | 说明 |
|---|---|---|
| departments → employees | 1:N | 一个部门下有多名员工 |
| departments → users | 1:N | 一个部门下有多名用户(主管/员工) |
| departments → announcements | 1:N | 一个部门可发布多条公告 |
| employees → users | 1:0..1 | 员工可关联一个登录账号(可选,admin 无关联) |
| users → announcements | 1:N | 一个用户可发布多条公告 |

## 角色权限

| 角色 | 员工管理 | 公告中心 | 个人中心 |
|---|---|---|---|
| **admin** 系统管理员 | 全部 CRUD | 全部 CRUD | 查看 | 
| **manager** 部门主管 | 本部门 CRUD | 本部门 CRUD | 查看+编辑自联 | 
| **employee** 普通员工 | 无权限 | 仅查看 | 查看+编辑自联 | 
