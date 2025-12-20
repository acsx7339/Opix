import React from 'react';
import { Category, CATEGORY_NAMES } from '../types';
import { LayoutGrid, Atom, Scale, History, Cpu, HeartPulse, Leaf, TrendingUp } from 'lucide-react';

interface SidebarProps {
  selectedCategory: Category | 'All';
  onSelectCategory: (category: Category | 'All') => void;
  isOpen: boolean;
  onCloseMobile: () => void;
}

const CATEGORY_ICONS: Record<Category, React.ReactNode> = {
  [Category.POLITICS]: <Scale size={20} />,
  [Category.SCIENCE]: <Atom size={20} />, 
  [Category.HISTORY]: <History size={20} />,
  [Category.TECHNOLOGY]: <Cpu size={20} />,
  [Category.HEALTH]: <HeartPulse size={20} />,
  [Category.ENVIRONMENT]: <Leaf size={20} />,
  [Category.ECONOMICS]: <TrendingUp size={20} />,
};

const getIcon = (cat: Category) => {
    switch(cat) {
        case Category.SCIENCE: return <div className="w-5 h-5 flex items-center justify-center font-bold text-xs">Sc</div>;
        default: return CATEGORY_ICONS[cat];
    }
}

export const Sidebar: React.FC<SidebarProps> = ({ selectedCategory, onSelectCategory, isOpen, onCloseMobile }) => {
  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden"
          onClick={onCloseMobile}
        />
      )}

      <aside className={`
        fixed top-16 bottom-0 left-0 w-64 bg-white border-r border-gray-200 z-30 transition-transform duration-300 ease-in-out
        md:translate-x-0 md:static md:h-[calc(100vh-4rem)]
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-4 overflow-y-auto h-full">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4 px-2">
            探索
          </h2>
          
          <nav className="space-y-1">
            <button
              onClick={() => { onSelectCategory('All'); onCloseMobile(); }}
              className={`w-full flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                selectedCategory === 'All'
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <LayoutGrid size={20} className="mr-3 text-gray-500" />
              所有主題
            </button>

            <div className="pt-4 pb-2">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-2 mb-2">分類</h3>
            </div>

            {Object.values(Category).map((category) => (
              <button
                key={category}
                onClick={() => { onSelectCategory(category); onCloseMobile(); }}
                className={`w-full flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                  selectedCategory === category
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <span className={`mr-3 ${selectedCategory === category ? 'text-blue-600' : 'text-gray-500'}`}>
                  {getIcon(category)}
                </span>
                {CATEGORY_NAMES[category]}
              </button>
            ))}
          </nav>
        </div>
      </aside>
    </>
  );
};