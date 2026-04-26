import { useState } from 'react'
import { Plus, PlayCircle, Split, Tag } from 'lucide-react'
import { QuestionsTab } from './QuestionsTab'
import { TagsTab } from './TagsTab'
import { LayoutTab } from './LayoutTab'

type TabType = 'questions' | 'tags' | 'layout'

export function QuizManagementPage() {
  const [activeTab, setActiveTab] = useState<TabType>('questions')

  const tabLabels: Record<TabType, string> = {
    questions: 'Pytania i odpowiedzi',
    tags: 'Oznaczenia i punktacja',
    layout: 'Układ Quizu',
  }

  return (
    <div className="w-full max-w-[1200px] mx-auto pt-12 px-4 md:px-8 xl:px-16">
      {/* Header */}
      <div className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          {/* Breadcrumbs */}
          <div className="text-[11px] xl:text-[12px] font-semibold tracking-wider text-primary/90 mb-1.5 font-manrope">
            Panel Admina &gt; Zarządzanie Quizem &gt; {tabLabels[activeTab]}
          </div>

          <h1 className="text-[36px] xl:text-[42px] font-bold text-dark font-manrope">
            {tabLabels[activeTab]}
          </h1>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-4">
          {activeTab === 'questions' && (
            <button className="bg-primary hover:bg-primary/90 text-white px-6 py-3 rounded-full font-medium text-[14px] xl:text-[15px] transition-colors flex items-center gap-2 shadow-soft cursor-pointer">
              <Plus className="size-4 xl:size-4.5" />
              Dodaj pytanie
            </button>
          )}

          {activeTab === 'tags' && (
            <button className="bg-secondary hover:bg-secondary/90 text-white px-6 py-3 rounded-full font-medium text-[14px] xl:text-[15px] transition-colors flex items-center gap-2 shadow-sm cursor-pointer">
              <Tag className="size-4 xl:size-4.5" />
              Nowe oznaczenie
            </button>
          )}

          {activeTab === 'layout' && (
            <>
              <button className="bg-secondary-2 hover:bg-secondary-2/90 text-white px-6 py-3 rounded-full font-medium text-[14px] xl:text-[15px] transition-colors flex items-center gap-2 shadow-sm cursor-pointer">
                <Split className="size-4 xl:size-4.5" />
                Rozwiąż ścieżkę
              </button>
              <button className="bg-primary hover:bg-primary/90 text-white px-6 py-3 rounded-full font-medium text-[14px] xl:text-[15px] transition-colors flex items-center gap-2 shadow-sm cursor-pointer">
                <PlayCircle className="size-4 xl:size-4.5" />
                Rozwiąż Quiz
              </button>
            </>
          )}
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-8 xl:gap-12 border-b border-gray/40 mb-8">
        {(Object.keys(tabLabels) as TabType[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-2 xl:pb-3 text-[14px] xl:text-[16px] font-medium transition-colors relative cursor-pointer ${activeTab === tab ? 'text-primary' : 'text-dark/50 hover:text-dark/80'
              }`}
          >
            {tabLabels[tab]}
            {activeTab === tab && (
              <div className="absolute bottom-[-1px] left-0 right-0 h-[2px] bg-primary" />
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="pb-20">
        {activeTab === 'questions' && <QuestionsTab />}
        {activeTab === 'tags' && <TagsTab />}
        {activeTab === 'layout' && <LayoutTab />}
      </div>
    </div>
  )
}
