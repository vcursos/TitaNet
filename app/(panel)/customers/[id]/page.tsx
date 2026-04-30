import { CustomerDetail } from '@/components/panel/customers/customer-detail'
export const dynamic = 'force-dynamic'
export const metadata = { title: 'Cliente | TitaNet' }
export default function CustomerDetailPage({ params }: { params: { id: string } }) {
  return <CustomerDetail id={params.id} />
}
