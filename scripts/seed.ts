// =============================================================================
// Seed do TitaNet - dados iniciais
// Execute: yarn prisma db seed
// =============================================================================
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Iniciando seed do TitaNet...')

  // Usuário admin de teste
  const adminPassword = await bcrypt.hash('johndoe123', 12)
  await prisma.user.upsert({
    where: { email: 'john@doe.com' },
    update: {},
    create: {
      email: 'john@doe.com',
      password: adminPassword,
      name: 'Administrador',
      role: 'admin',
    },
  })
  console.log('✅ Usuário administrador criado')

  // Configurações padrão
  await prisma.settings.upsert({
    where: { id: 'singleton' },
    update: {},
    create: {
      id: 'singleton',
      companyName: 'TitaNet Provedor',
      primaryColor: '#0066CC',
      secondaryColor: '#FFFFFF',
      accentColor: '#003E80',
    },
  })
  console.log('✅ Configurações padrão criadas')

  // Planos exemplo
  const planos = [
    { name: 'Fibra Básica', description: 'Ideal para uso básico, navegação e streaming.', downloadMbps: 100, uploadMbps: 50, price: 79.90 },
    { name: 'Fibra Plus', description: 'Para famílias com múltiplos dispositivos.', downloadMbps: 300, uploadMbps: 150, price: 99.90 },
    { name: 'Fibra Pro', description: 'Alta performance para home office.', downloadMbps: 500, uploadMbps: 250, price: 129.90 },
    { name: 'Fibra Ultra', description: 'Máxima velocidade disponível.', downloadMbps: 1000, uploadMbps: 500, price: 199.90 },
  ]
  const createdPlans: any[] = []
  for (const p of planos) {
    const plan = await prisma.plan.upsert({
      where: { id: `plan-${p.name.toLowerCase().replace(/\s+/g, '-')}` },
      update: {},
      create: { id: `plan-${p.name.toLowerCase().replace(/\s+/g, '-')}`, ...p },
    })
    createdPlans.push(plan)
  }
  console.log(`✅ ${planos.length} planos criados`)

  // Clientes de exemplo
  const clientes = [
    { name: 'João da Silva', document: '12345678901', email: 'joao@email.com', phone: '11999990001', city: 'São Paulo', state: 'SP', neighborhood: 'Centro', street: 'Rua A', number: '100', planIdx: 1, status: 'active', isOnline: true, network: 'PON-01', equipment: 'Huawei HG8546M' },
    { name: 'Maria Souza', document: '23456789012', email: 'maria@email.com', phone: '11999990002', city: 'São Paulo', state: 'SP', neighborhood: 'Vila Mariana', street: 'Rua B', number: '250', planIdx: 2, status: 'active', isOnline: true, network: 'PON-02', equipment: 'ZTE F660' },
    { name: 'Pedro Almeida', document: '34567890123', email: 'pedro@email.com', phone: '11999990003', city: 'Guarulhos', state: 'SP', neighborhood: 'Centro', street: 'Av. C', number: '500', planIdx: 0, status: 'overdue', isOnline: false, network: 'PON-01', equipment: 'Huawei HG8546M' },
    { name: 'Ana Costa', document: '45678901234', email: 'ana@email.com', phone: '11999990004', city: 'Osasco', state: 'SP', neighborhood: 'Centro', street: 'Rua D', number: '78', planIdx: 3, status: 'active', isOnline: true, network: 'PON-03', equipment: 'Fiberhome AN5506' },
    { name: 'Carlos Lima', document: '56789012345', phone: '11999990005', city: 'São Paulo', state: 'SP', neighborhood: 'Pinheiros', street: 'Rua E', number: '34', planIdx: 1, status: 'inactive', isOnline: false, network: 'PON-02' },
    { name: 'Internet Brasil LTDA', document: '12345678000190', email: 'contato@internetbrasil.com', phone: '1133334444', city: 'São Paulo', state: 'SP', neighborhood: 'Itaim', street: 'Av. Paulista', number: '1500', planIdx: 3, status: 'active', isOnline: true, network: 'PON-04', equipment: 'Huawei HG8546M' },
  ]

  for (const c of clientes) {
    const plan = createdPlans[c.planIdx]
    await prisma.customer.upsert({
      where: { document: c.document },
      update: {},
      create: {
        name: c.name,
        document: c.document,
        documentType: c.document.length === 14 ? 'CNPJ' : 'CPF',
        email: c.email ?? null,
        phone: c.phone ?? null,
        city: c.city ?? null,
        state: c.state ?? null,
        neighborhood: c.neighborhood ?? null,
        street: c.street ?? null,
        number: c.number ?? null,
        planId: plan?.id ?? null,
        monthlyPrice: plan?.price ?? null,
        status: c.status,
        isOnline: c.isOnline ?? false,
        network: c.network ?? null,
        equipment: c.equipment ?? null,
        lastSeen: c.isOnline ? new Date() : null,
      },
    })
  }
  console.log(`✅ ${clientes.length} clientes criados`)

  console.log('🎉 Seed concluído!')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
