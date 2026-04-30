import { ContractDetail } from '@/components/panel/contracts/contract-detail'
export const dynamic = 'force-dynamic'
export const metadata = { title: 'Contrato | TitaNet' }
export default function ContractDetailPage({ params }: { params: { id: string } }) {
  return <ContractDetail id={params.id} />
}
