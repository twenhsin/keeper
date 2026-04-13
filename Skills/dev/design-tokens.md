# design-tokens.md
> Skill：Design Token 生成規則
> 適用專案：Keeper（可沿用至其他專案）
> 最後更新：2026-04-13

---

## 一、Token 架構總覽

所有 token 分為三層，層層引用，不可跨層跳引：

```
Core → Semantic → Component
```

| 層級 | 定義 | 可直接用於樣式？ |
|------|------|----------------|
| Core | 原始數值，無語意 | ❌ 不可直接使用 |
| Semantic | 賦予語意的別名 | ✅ 主要使用層 |
| Component | 特定元件的狀態覆寫 | ✅ 限對應元件使用 |

---

## 二、輸出格式

### 開發端格式（DTF）
tokens.json 預設採用 Design Token Format（W3C 標準草案）：

```json
{
  "spacing": {
    "100": { "$value": "4px", "$type": "spacing" }
  }
}
```

### Token Studio 匯入格式（Legacy）
匯入 Token Studio 時，由 Claude Code 轉換為 Legacy 格式：

```json
{
  "spacing": {
    "100": { "value": "4px", "type": "spacing" }
  }
}
```

轉換規則：將所有 `$value` 改為 `value`，`$type` 改為 `type`，結構不變。

---

## 三、Core Token 規則

### 3.1 Color

**色階命名：** 數字代表深淺，100 最淺，900 最深。

```json
{
  "color": {
    "gray": {
      "100": { "$value": "#F5F5F5", "$type": "color" },
      "200": { "$value": "#E5E5E5", "$type": "color" },
      "300": { "$value": "#D4D4D4", "$type": "color" },
      "500": { "$value": "#737373", "$type": "color" },
      "700": { "$value": "#404040", "$type": "color" },
      "900": { "$value": "#171717", "$type": "color" }
    },
    "brand": {
      "primary": { "$value": "#HEXCODE", "$type": "color" },
      "secondary": { "$value": "#HEXCODE", "$type": "color" }
    }
  }
}
```

**Brand token 規則：**
- 不設色階，直接命名語意角色（primary、secondary、accent）
- 目的是換品牌時只需更新 brand 層，不影響 semantic 引用結構

**色階不必連續：** 只定義設計中實際使用的色階，未使用的數字不填。

### 3.2 Spacing

**命名規則：** 以 100 為單位，對應實際 px 值。

| Token | 值 |
|-------|----|
| 100 | 4px |
| 200 | 8px |
| 300 | 12px |
| 400 | 16px |
| 500 | 20px |
| 600 | 24px |
| 700 | 32px |
| 800 | 40px |
| 900 | 48px |
| 1000 | 64px |

非標準值插入規則：遇到如 18px，插入 `450: 18px`，以數值對應的比例位置命名。

```json
{
  "spacing": {
    "100": { "$value": "4px", "$type": "spacing" },
    "200": { "$value": "8px", "$type": "spacing" },
    "400": { "$value": "16px", "$type": "spacing" },
    "450": { "$value": "18px", "$type": "spacing" },
    "600": { "$value": "24px", "$type": "spacing" }
  }
}
```

**Advanced — Multiplier 方式（供學習參考）**

Token Studio 支援在 token 值內寫運算式，以 base 值乘以倍數推導所有 spacing：

```json
{
  "spacing": {
    "base": { "$value": "8", "$type": "spacing" },
    "100": { "$value": "{spacing.base} * 0.5", "$type": "spacing" },
    "200": { "$value": "{spacing.base} * 1", "$type": "spacing" },
    "300": { "$value": "{spacing.base} * 2", "$type": "spacing" }
  }
}
```

適用情境：多品牌系統、需要整體 scale 縮放的響應式設計。
Keeper 預設不採用此方式，改 base 雖方便但乘數不直覺，維護成本較高。

### 3.3 Border Radius

```json
{
  "radius": {
    "100": { "$value": "4px", "$type": "borderRadius" },
    "200": { "$value": "8px", "$type": "borderRadius" },
    "300": { "$value": "12px", "$type": "borderRadius" },
    "400": { "$value": "16px", "$type": "borderRadius" },
    "full": { "$value": "9999px", "$type": "borderRadius" }
  }
}
```

### 3.4 Typography

**單位規則：** 所有字級使用 rem，括號內標註對應 px 值（基準：html font-size 62.5%，1rem = 10px）。

```json
{
  "fontSize": {
    "_unit_rule": "所有字級使用 rem，基準：html font-size 62.5%，1rem = 10px",
    "100": { "$value": "1.2rem", "$type": "fontSizes" },
    "200": { "$value": "1.4rem", "$type": "fontSizes" },
    "300": { "$value": "1.6rem", "$type": "fontSizes" },
    "400": { "$value": "2.0rem", "$type": "fontSizes" },
    "500": { "$value": "2.4rem", "$type": "fontSizes" },
    "600": { "$value": "3.2rem", "$type": "fontSizes" }
  },
  "fontWeight": {
    "regular": { "$value": "400", "$type": "fontWeights" },
    "medium": { "$value": "500", "$type": "fontWeights" },
    "bold": { "$value": "700", "$type": "fontWeights" }
  },
  "lineHeight": {
    "tight": { "$value": "1.2", "$type": "lineHeights" },
    "normal": { "$value": "1.5", "$type": "lineHeights" },
    "loose": { "$value": "1.8", "$type": "lineHeights" }
  },
  "letterSpacing": {
    "tight": { "$value": "-0.02em", "$type": "letterSpacing" },
    "normal": { "$value": "0em", "$type": "letterSpacing" },
    "wide": { "$value": "0.08em", "$type": "letterSpacing" }
  }
}
```

### 3.5 Shadow

```json
{
  "shadow": {
    "100": { "$value": "0 1px 2px rgba(0,0,0,0.05)", "$type": "boxShadow" },
    "200": { "$value": "0 2px 8px rgba(0,0,0,0.08)", "$type": "boxShadow" },
    "300": { "$value": "0 4px 16px rgba(0,0,0,0.12)", "$type": "boxShadow" }
  }
}
```

### 3.6 Dimension

通用尺寸，用於 icon size、avatar size、固定高度等：

```json
{
  "dimension": {
    "100": { "$value": "16px", "$type": "dimension" },
    "200": { "$value": "24px", "$type": "dimension" },
    "300": { "$value": "32px", "$type": "dimension" },
    "400": { "$value": "40px", "$type": "dimension" },
    "500": { "$value": "48px", "$type": "dimension" }
  }
}
```

---

## 四、Semantic Token 規則

Semantic token 引用 Core token，不使用原始數值。
命名格式：`{類別}/{用途}` 或 `{類別}/{用途}/{變體}`

### 4.1 Color Semantic

```json
{
  "color": {
    "background": {
      "default": { "$value": "{color.gray.100}", "$type": "color" },
      "surface": { "$value": "{color.gray.200}", "$type": "color" },
      "overlay": { "$value": "{color.gray.900}", "$type": "color" }
    },
    "text": {
      "primary": { "$value": "{color.gray.900}", "$type": "color" },
      "secondary": { "$value": "{color.gray.500}", "$type": "color" },
      "inverse": { "$value": "{color.gray.100}", "$type": "color" },
      "brand": { "$value": "{color.brand.primary}", "$type": "color" }
    },
    "border": {
      "default": { "$value": "{color.gray.300}", "$type": "color" },
      "strong": { "$value": "{color.gray.500}", "$type": "color" }
    },
    "interactive": {
      "default": { "$value": "{color.brand.primary}", "$type": "color" },
      "hover": { "$value": "{color.brand.secondary}", "$type": "color" },
      "disabled": { "$value": "{color.gray.300}", "$type": "color" }
    }
  }
}
```

### 4.2 Spacing Semantic

```json
{
  "spacing": {
    "gap": {
      "item": { "$value": "{spacing.200}", "$type": "spacing" },
      "section": { "$value": "{spacing.600}", "$type": "spacing" },
      "page": { "$value": "{spacing.900}", "$type": "spacing" }
    },
    "padding": {
      "tag": {
        "x": { "$value": "{spacing.300}", "$type": "spacing" },
        "y": { "$value": "{spacing.100}", "$type": "spacing" }
      },
      "card": {
        "x": { "$value": "{spacing.600}", "$type": "spacing" },
        "y": { "$value": "{spacing.600}", "$type": "spacing" }
      },
      "page": {
        "x": { "$value": "{spacing.600}", "$type": "spacing" },
        "y": { "$value": "{spacing.700}", "$type": "spacing" }
      },
      "button": {
        "x": { "$value": "{spacing.500}", "$type": "spacing" },
        "y": { "$value": "{spacing.300}", "$type": "spacing" }
      }
    }
  }
}
```

### 4.3 Typography Semantic

```json
{
  "typography": {
    "display": {
      "size": { "$value": "{fontSize.600}", "$type": "fontSizes" },
      "weight": { "$value": "{fontWeight.bold}", "$type": "fontWeights" },
      "lineHeight": { "$value": "{lineHeight.tight}", "$type": "lineHeights" }
    },
    "heading": {
      "size": { "$value": "{fontSize.500}", "$type": "fontSizes" },
      "weight": { "$value": "{fontWeight.bold}", "$type": "fontWeights" },
      "lineHeight": { "$value": "{lineHeight.tight}", "$type": "lineHeights" }
    },
    "body": {
      "size": { "$value": "{fontSize.300}", "$type": "fontSizes" },
      "weight": { "$value": "{fontWeight.regular}", "$type": "fontWeights" },
      "lineHeight": { "$value": "{lineHeight.normal}", "$type": "lineHeights" }
    },
    "caption": {
      "size": { "$value": "{fontSize.100}", "$type": "fontSizes" },
      "weight": { "$value": "{fontWeight.regular}", "$type": "fontWeights" },
      "lineHeight": { "$value": "{lineHeight.normal}", "$type": "lineHeights" }
    },
    "label": {
      "size": { "$value": "{fontSize.200}", "$type": "fontSizes" },
      "weight": { "$value": "{fontWeight.medium}", "$type": "fontWeights" },
      "letterSpacing": { "$value": "{letterSpacing.wide}", "$type": "letterSpacing" }
    }
  }
}
```

### 4.4 Radius / Shadow Semantic

```json
{
  "radius": {
    "small": { "$value": "{radius.100}", "$type": "borderRadius" },
    "medium": { "$value": "{radius.200}", "$type": "borderRadius" },
    "large": { "$value": "{radius.400}", "$type": "borderRadius" },
    "pill": { "$value": "{radius.full}", "$type": "borderRadius" }
  },
  "shadow": {
    "subtle": { "$value": "{shadow.100}", "$type": "boxShadow" },
    "card": { "$value": "{shadow.200}", "$type": "boxShadow" },
    "modal": { "$value": "{shadow.300}", "$type": "boxShadow" }
  }
}
```

---

## 五、Component Token 規則

### 判斷標準：以下任一條件成立則建立 Component Token

1. 有 3 個以上互動狀態（default、hover、active、disabled、focus）
2. 有多個尺寸變體（sm、md、lg）且尺寸影響多個屬性
3. 有多個視覺變體（primary、secondary、outline、ghost）
4. 靜態元件不建立 Component Token，直接使用 Semantic token

### Component Token 命名格式

```
{component}/{variant}/{state}/{property}
```

範例：
```json
{
  "button": {
    "primary": {
      "default": {
        "background": { "$value": "{color.interactive.default}", "$type": "color" },
        "text": { "$value": "{color.text.inverse}", "$type": "color" },
        "border": { "$value": "transparent", "$type": "color" }
      },
      "hover": {
        "background": { "$value": "{color.interactive.hover}", "$type": "color" }
      },
      "disabled": {
        "background": { "$value": "{color.interactive.disabled}", "$type": "color" },
        "text": { "$value": "{color.text.secondary}", "$type": "color" }
      }
    },
    "outline": {
      "default": {
        "background": { "$value": "transparent", "$type": "color" },
        "text": { "$value": "{color.interactive.default}", "$type": "color" },
        "border": { "$value": "{color.interactive.default}", "$type": "color" }
      }
    }
  }
}
```

### 尺寸變體處理

尺寸影響多個屬性（padding、font-size、radius）時，在 Component Token 內定義：

```json
{
  "card": {
    "sm": {
      "padding": { "$value": "{spacing.padding.card.x}", "$type": "spacing" },
      "radius": { "$value": "{radius.small}", "$type": "borderRadius" }
    },
    "lg": {
      "padding": { "$value": "{spacing.700}", "$type": "spacing" },
      "radius": { "$value": "{radius.large}", "$type": "borderRadius" }
    }
  }
}
```

### Keeper 預期需要 Component Token 的元件

Claude Code 執行時，根據設計截圖自動判斷，預期包含：

- `button`（primary、outline、ghost × default、hover、disabled）
- `input`（default、focus、error、disabled）
- `card`（task card sm/lg × default、active）
- `toggle`（on、off、disabled）
- `tag`（default、active）

若截圖中發現其他符合判斷標準的元件，自動納入。

---

## 六、Claude Code 執行指令格式

當被要求生成 tokens.json 時，執行步驟：

1. 讀取 `design-system.md` 取得實際數值
2. 讀取設計截圖（若有）識別使用中的數值
3. 依照本文件規則建立三層結構
4. 輸出 DTF 格式的 tokens.json。字級單位統一輸出 rem，格式為 "1.6rem"，不使用 px。
5. 若需匯入 Token Studio，另外輸出 Legacy 格式版本（檔名加 `-legacy` 後綴）
6. 列出所有新增的 token 清單供確認

---

## 七、檔案輸出結構

```
tokens/
  core.json        — Core token
  semantic.json    — Semantic token
  component.json   — Component token
  index.json       — 合併版（Token Studio 匯入用）
  index-legacy.json — Legacy 格式（Token Studio 實際匯入檔）
```

---

## 八、與其他 Skill 的關係

| Skill | 與本文件的關係 |
|-------|--------------|
| `design-system.md` | 提供實際數值，本文件引用其數值填入 Core 層 |
| `component-gen.md` | Component token 的命名結構與元件程式碼保持一致 |
| `ui-codegen.md` | 頁面生成時引用 Semantic token 名稱，不使用原始數值 |
