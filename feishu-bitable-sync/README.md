# Feishu Bitable Sync

用于把本地 JSON/CSV 数据批量同步到飞书多维表格，作为小程序后台的数据写入工具。

## 功能目标（v1）

- 获取 tenant_access_token
- 读取指定 bitable 的数据表
- 按配置字段把本地案例数据写入飞书多维表格
- 支持 upsert（按唯一键更新，不重复新增）
- 支持 dry-run

## 目录结构

- `sync.py`：主脚本
- `config.example.json`：配置模板
- `data/example-offers.json`：示例数据

## 使用方式

1. 复制配置模板：
   ```bash
   cp config.example.json config.json
   ```
2. 在 `config.json` 中填入：
   - `app_id`
   - `app_secret`
   - `app_token`
   - `table_id`
3. 准备数据文件（JSON）
4. 先 dry-run：
   ```bash
   python3 sync.py --config config.json --data data/example-offers.json --dry-run
   ```
5. 正式写入：
   ```bash
   python3 sync.py --config config.json --data data/example-offers.json
   ```

## 说明

- 当前默认使用“唯一键字段”做 upsert，避免重复导入。
- 建议把敏感配置写入 `config.json`，并确保不提交到仓库。
- 如果后续需要，也可以扩展为：
  - 自动创建字段
  - 从 CSV 导入
  - 同步图片/附件
  - 定时更新
