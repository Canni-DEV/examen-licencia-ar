import { useTranslation } from 'react-i18next'
import ReactionTest from '../../components/psycho/ReactionTest'
import ConstantVelocityOcclusionTest from '../../components/psycho/ConstantVelocityOcclusionTest'
import CoordinationTest from '../../components/psycho/CoordinationTest'
import AttentionReactionTest from '../../components/psycho/AttentionReactionTest'

export default function PsychoTestsPage() {
  const { t } = useTranslation()
  return (
    <section className="space-y-6">
      <h1 className="text-2xl font-bold">{t('exam.psycho')}</h1>

      {/* Reflejos */}
      <ReactionTest />

      {/* Velocidad constante con ocultamiento */}
      <ConstantVelocityOcclusionTest />

      {/* Coordinación bimanual */}
      <CoordinationTest />

      {/* Atención + Reacción */}
      <AttentionReactionTest />
    </section>
  )
}
