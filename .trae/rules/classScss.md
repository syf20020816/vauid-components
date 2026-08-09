# useCls / vcls 与 SCSS 类名约定

## 核心规则

使用 `useCls` hook 时，TSX 中的 `cls` 和 `vcls` 与 SCSS 中的 `@include cmp()` + `&-` 嵌套是一一对应关系。

## TSX 侧

```tsx
const { cls, vcls } = useCls("component-name", className);
```

| 用法 | 生成的类名 | 用途 |
|------|-----------|------|
| `cls` | `vauid-component-name` (+ className) | 根元素 |
| `vcls("child")` | `vauid-component-name-child` | 子元素 |
| `vcls("child", true)` | `vauid-component-name__child` | 子元素（`__` 分隔，语义更重） |

数组形式支持条件类（modifier）：

```tsx
const { cls } = useCls(["component-name", isActive && "active"]);
// active=true  → vauid-component-name vauid-active
// active=false → vauid-component-name
```

## SCSS 侧

**子元素用 `&-suffix` 嵌套在根 `@include cmp()` 内**，不要写独立的 `@include cmp("component-name-child")`。

```scss
// ✅ 正确：&- 嵌套
@include cmp("component-name") {
  // 根元素样式
  display: flex;

  &-child {
    // → .vauid-component-name-child
    color: red;
  }

  &-another {
    // → .vauid-component-name-another
    color: blue;
  }
}
```

```scss
// ❌ 错误：子元素不要用独立的 @include cmp
@include cmp("component-name") {
  display: flex;
  @include cmp("component-name-child") {  // → .vauid-component-name .vauid-component-name-child（后代选择器，非预期）
    color: red;
  }
}
```

### 为什么 `&-` 而不是嵌套 `@include cmp()`

- `&-child` 生成 **平坦选择器** `.vauid-component-name-child`（单个类）
- 嵌套 `@include cmp("component-name-child")` 生成 **后代选择器** `.vauid-component-name .vauid-component-name-child`

子元素在 DOM 中不一定是根元素的后代（如 Portal 渲染的下拉层），后代选择器会匹配失败。`&-` 生成的平坦选择器更安全、更简洁。

### Modifier（条件类）

条件类用 `&.vauid-modifier` 表示同一元素上的附加类：

```scss
@include cmp("dropdown-item") {
  &:hover {
    background-color: color("primary-hover");
  }

  // 选中态：放在 :hover 之后，保证选中项 hover 时仍保持选中背景
  &.vauid-active {
    background-color: color("primary-active");
  }
}
```

## 例外：共用类名

如果一个类名被多个组件共用（不通过 `vcls` 派生），保持独立的 `@include cmp()` 块。

```scss
// dropdown-item 被 trigger 和 dropdown 两个组件共用，保持独立
@include cmp("dropdown-item") {
  ...
}
```

## 完整示例

TSX:
```tsx
const { cls, vcls } = useCls("toggle-trigger", classNames?.trigger);

return (
  <div className={cls}>
    <Button className={vcls("button")} />
    <div className={vcls("icon")} />
  </div>
);
// Portal 渲染的下拉层
<div className={vcls("dropdown")} />
```

SCSS:
```scss
@include cmp("toggle-trigger") {
  @include flex-center;
  border: 1px solid color("border-default");

  &-button {
    border-radius: radius("md") 0 0 radius("md");
  }

  &-icon {
    background-color: transparent;
  }

  &-dropdown {
    background-color: color("bg-elevated");
    border: 1px solid color("border-default");
  }
}
```
