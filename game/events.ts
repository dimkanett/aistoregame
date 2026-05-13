import { FinancialMarket, MarketEvent } from './types';
import { clamp } from './calculations';

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
  },
  {
    title: 'Рост ставки рефинансирования',
    description: 'Новые кредиты станут дороже, потребители осторожнее.',
    effects: { refinancingRateDelta: 0.015, consumerConfidenceDelta: -0.04 }
  },
  {
    title: 'Период дешёвых денег',
    description: 'Кредитование становится доступнее для устойчивых магазинов.',
    effects: { refinancingRateDelta: -0.012, creditAvailabilityDelta: 0.08 }
  },
  {
    title: 'Инфляционный шок',
    description: 'Инфляция растёт, покупатели сильнее смотрят на цену.',
    effects: { inflationDelta: 0.02, consumerConfidenceDelta: -0.06 }
  },
  {
    title: 'Рост потребительского спроса',
    description: 'Настроение покупателей улучшается.',
    effects: { consumerConfidenceDelta: 0.08 }
  }
];

const randomEvent = (): Omit<MarketEvent, 'id' | 'durationWeeks'> => EVENT_POOL[Math.floor(Math.random() * EVENT_POOL.length)];

export const rollNewEvent = (week: number): MarketEvent | null => {
  if (week % 3 !== 0) return null;
  if (Math.random() < 0.55) {
    const event = randomEvent();
    return {
      id: `event-${week}-${Math.random().toString(36).slice(2, 7)}`,
      durationWeeks: 2 + Math.floor(Math.random() * 3),
      ...event
    };
  }

  return null;
};

export const progressEvents = (events: MarketEvent[]): MarketEvent[] =>
  events
    .map((event) => ({ ...event, durationWeeks: event.durationWeeks - 1 }))
    .filter((event) => event.durationWeeks > 0);

export const applyFinancialEventEffects = (market: FinancialMarket, events: MarketEvent[]): FinancialMarket =>
  events.reduce(
    (next, event) => ({
      refinancingRate: clamp(next.refinancingRate + (event.effects.refinancingRateDelta ?? 0), 0.03, 0.25),
      inflationRate: clamp(next.inflationRate + (event.effects.inflationDelta ?? 0), 0.01, 0.3),
      consumerConfidence: clamp(next.consumerConfidence + (event.effects.consumerConfidenceDelta ?? 0), 0.25, 1.25),
      creditAvailability: clamp(next.creditAvailability + (event.effects.creditAvailabilityDelta ?? 0), 0.2, 1.25)
    }),
    market
  );
