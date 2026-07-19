// 种子数据脚本：写入初始博主、商户，并创建一个默认运营方账号。
// 运行：配置 DATABASE_URL 后执行 `npm run db:seed`
import { PrismaClient } from "@prisma/client";
import { readFileSync } from "fs";
import { randomBytes, scrypt } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);
const prisma = new PrismaClient();

async function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const d = (await scryptAsync(password, salt, 64)).toString("hex");
  return `${salt}:${d}`;
}

async function main() {
  const creators = JSON.parse(
    readFileSync(new URL("../data/creators.json", import.meta.url))
  );
  for (const c of creators) {
    const handle = String(c.handle).replace(/^@/, "");
    const exists = await prisma.creator.findFirst({ where: { handle } });
    if (!exists) {
      await prisma.creator.create({
        data: {
          handle,
          followers: c.followers || 0,
          engagementRate: c.engagementRate || 0,
          niche: c.niche || [],
          city: c.city || "多伦多",
          rateCAD: c.rateCAD || 0,
          availability: c.availability !== false,
          pastCases: c.pastCases || [],
          embedding: [],
          note: c.note || "",
        },
      });
    }
  }

  const merchants = JSON.parse(
    readFileSync(new URL("../data/merchants.json", import.meta.url))
  );
  for (const m of merchants) {
    const exists = await prisma.merchant.findFirst({ where: { name: m.name } });
    if (!exists) {
      await prisma.merchant.create({
        data: {
          name: m.name,
          industry: m.industry || "",
          contact: m.contact || "",
          email: m.email || null,
        },
      });
    }
  }

  const opEmail = "operator@redtoronto.com";
  const existOp = await prisma.user.findUnique({ where: { email: opEmail } });
  if (!existOp) {
    await prisma.user.create({
      data: {
        email: opEmail,
        name: "运营管理员",
        passwordHash: await hashPassword("admin123"),
        role: "operator",
      },
    });
    console.log("已创建默认运营方账号：", opEmail, "密码：admin123（请尽快修改）");
  }

  console.log("种子数据写入完成。");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
