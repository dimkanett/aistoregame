import { MarketEvent } from './types';

const EVENT_POOL: Omit<MarketEvent, 'id' | 'durationWeeks'>[] = [
  {
    title: 'Ограничение торговой надбавки',
    description: 'Надбавка на ряд категорий ограничена 65%.',
    effects: { maxMarginCap: 65 }
  },
  {
    title: 'Проверка контролирующих органов',
    description: 'Риск штрафов при низкой операционной дисциплине.',
    effects: { complianceCost: 45_000 }
  },
  {
    title: 'Рост налоговой нагрузки',
    description: 'Операционные расходы выросли на период действия события.',
    effects: { taxMultiplier: 1.08 }
  },
  {
    title: 'Ограничения на рекламу скидок',
    description: 'Скидочные кампании теряют часть эффективности.',
    effects: { discountAdPenalty: 0.8 }
  },
  {
    title: 'Изменение правил импорта',
    description: 'Закупочные цены части ассортимента временно растут.',
    effects: { importCostMultiplier: 1.09 }
  },
  {
    title: 'Обязательная маркировка',
    description: 'Требуется разовая адаптация процессов.',
    effects: { complianceCost: 80_000 }
  }
];

const randomEvent = (): Omit<MarketEvent, 'id' | 'durationWeeks'> =>
  EVENT_POOL[Math.floor(Math.random() * EVENT_POOL.length)];

export const rollNewEvent = (week: number): MarketEvent | null => {
  if (week % 3 !== 0) return null;
  if (Math.random() < 0.45) {
    const event = randomEvent();
    return {
      id: `event-${week}-${Math.random().toString(36).slice(2, 7)}`,
      durationWeeks: 2 + Math.floor(Math.random() * 2),
      ...event
    };
  }

  return null;
};

export const progressEvents = (events: MarketEvent[]): MarketEvent[] =>
  events
    .map((event) => ({ ...event, durationWeeks: event.durationWeeks - 1 }))
    .filter((event) => event.durationWeeks > 0);
