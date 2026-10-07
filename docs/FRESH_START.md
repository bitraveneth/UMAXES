# Fresh start (one page)

**Keeps:** product catalog + Distro / Wholesaler / Shop prices  
**Empty:** orders, buyers, wholesalers, retail, other staff, stock qty (0)  
**Logins left:** Super admin + Admin only

Also in admin: **Learning → Fresh start checklist** (English / 中文).

---

## On the server (after git pull)

```bash
cd /path/to/umaxes
git pull origin v2
npm ci
npx prisma migrate deploy
npm run build
# restart your process (pm2 / systemd / platform)

# Wipe demo/ops — catalog & prices stay
npm run db:fresh-production
```

**Do not** run `npm run db:reseed` or `db:seed-demo` on production.

---

## Sign in (change passwords immediately)

| Role | Email | Temp password |
|------|--------|----------------|
| Super admin | `super@umaxes.com` | `Super1234!` |
| Admin | `admin@umaxes.com` | `Admin1234!` |

Profile → change password for both.

---

## Client operating order

1. **Payments** — active bank account for PI / TT  
2. **Warehouse** — receive stock by cases (1 case = 95 pcs)  
3. **Login images** (optional) — login / register panel photos  
4. **Staff** (Super admin only) — add Sales / Logistics when needed  
5. **Approvals** — when a buyer registers, set level → Approve  
   - Or **Users → Add user** to create a company + password yourself  
6. **Orders** — confirm **Payment** and **Shipping** as two separate saves  
7. **Packing / Shipments** — packing list + tracking  

Daily detail: Learning Hub → Simple daily SOP + courses.

---

## 中文摘要

- 上线后执行：`npm run db:fresh-production`（保留商品与价格，清空订单/客户/库存数量）  
- 仅保留超级管理员与管理员；请立刻改密码  
- 先设银行账户 → 仓库入库 → 审批客户 → 再处理订单付款与发货  
- 学习中心 →「全新上线清单」有完整中文步骤  
