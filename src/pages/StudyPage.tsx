import { useEffect, useState } from 'react'
import { StudySection } from '../types'
import { useTranslation } from 'react-i18next'
import { publicPath } from '../utils/paths'

type Tab = 'manual' | 'senales' | 'material'

export default function StudyPage() {
  const { t, i18n } = useTranslation()
  const [tab, setTab] = useState<Tab>('manual')
  const [sections, setSections] = useState<StudySection[]>([])
  const fileMap: Record<Tab, string> = {
    manual: `data/${i18n.language}/estudio_manual.json`,
    senales: `data/${i18n.language}/estudio_senales.json`,
    material: `data/${i18n.language}/estudio_material.json`
  }

  useEffect(() => {
    const url = publicPath('/' + fileMap[tab])
    fetch(url).then(r => r.json()).then(setSections).catch(() => setSections([]))
  }, [tab, i18n.language])

  return (
    <section>
      <h1 className="text-2xl font-bold mb-4">{t('nav.study')}</h1>
      <div className="flex gap-2 mb-4 overflow-auto">
        <TabBtn active={tab === 'manual'} onClick={() => setTab('manual')}>{t('study.manual')}</TabBtn>
        <TabBtn active={tab === 'senales'} onClick={() => setTab('senales')}>{t('study.signals')}</TabBtn>
        <TabBtn active={tab === 'material'} onClick={() => setTab('material')}>{t('study.material')}</TabBtn>
      </div>

      <div className="prose max-w-none">
        {sections.map((s, i) => (
          <section key={i} className="mb-6">
            <h2>{s.titulo}</h2>
            <div dangerouslySetInnerHTML={{ __html: s.html }} />
          </section>
        ))}
      </div>
    </section>
  )
}

function TabBtn({ active, children, onClick }: any) {
  return (
    <button
      onClick={onClick}
      className={
        'px-3 py-2 rounded-xl border ' +
        (active ? 'border-brand-primary text-brand-primary bg-blue-50' : 'hover:bg-gray-50')
      }
      role="tab"
      aria-selected={active}
    >
      {children}
    </button>
  )
}
