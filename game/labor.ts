import { clamp, deriveStaffFromEmployees } from './calculations';
import { JobRequest, StoreEntity, Worker, WorkerRole } from './types';

export const roleLabel: Record<WorkerRole, string> = {
  seller: 'Продавец',
  marketer: 'Маркетолог'
};

export const candidateInterestScore = (worker: Worker, store: StoreEntity, offeredSalary: number): number => {
  if (offeredSalary < worker.minAcceptableSalary || worker.status !== 'available') return -100;

  const salaryScore = offeredSalary >= worker.expectedSalary ? 35 : ((offeredSalary - worker.minAcceptableSalary) / Math.max(1, worker.expectedSalary - worker.minAcceptableSalary)) * 24;
  const reputationScore = store.reputation * 0.18;
  const stabilityScore = store.financialHealth === 'healthy' ? 18 : store.financialHealth === 'strained' ? 8 : -18;
  const workloadScore = store.staff.workload < 0.85 ? 12 : store.staff.workload > 1.15 ? -12 : 4;
  const loyaltyFitScore = worker.loyalty > 70 && store.financialHealth === 'healthy' ? 8 : 0;
  const riskPenalty = store.lossStreak * 5;

  return salaryScore + reputationScore + stabilityScore + workloadScore + loyaltyFitScore - riskPenalty;
};

export const processJobRequests = (
  store: StoreEntity,
  cityWorkers: Worker[],
  week: number
): { store: StoreEntity; cityWorkers: Worker[]; events: string[] } => {
  const events: string[] = [];
  let nextWorkers = cityWorkers.map((worker) => ({ ...worker }));
  const jobRequests = store.jobRequests.map((request) => {
    if (request.status !== 'open' || request.createdWeek >= week) return request;

    const candidates = nextWorkers
      .filter((worker) => worker.role === request.role && worker.status === 'available')
      .map((worker) => ({ worker, score: candidateInterestScore(worker, store, request.offeredSalary) }))
      .filter((item) => item.score >= 35)
      .sort((a, b) => b.score - a.score)
      .slice(0, 4)
      .map((item) => item.worker.id);

    if (candidates.length > 0) {
      events.push(`Неделя ${week}: по заявке «${roleLabel[request.role]}» пришло кандидатов: ${candidates.length}.`);
    }

    return {
      ...request,
      status: 'processed' as const,
      candidates,
      expiresWeek: week + 2
    } satisfies JobRequest;
  });

  nextWorkers = nextWorkers.map((worker) => {
    if (worker.status === 'unavailable' && worker.unavailableUntilWeek !== undefined && worker.unavailableUntilWeek <= week) {
      return { ...worker, status: 'available', unavailableUntilWeek: undefined };
    }
    return worker;
  });

  return { store: { ...store, jobRequests }, cityWorkers: nextWorkers, events };
};

export const hireWorker = (
  store: StoreEntity,
  cityWorkers: Worker[],
  requestId: string,
  workerId: string
): { store: StoreEntity; cityWorkers: Worker[] } => {
  const request = store.jobRequests.find((item) => item.id === requestId);
  const worker = cityWorkers.find((item) => item.id === workerId);
  if (!request || !worker || !request.candidates.includes(workerId)) return { store, cityWorkers };

  const hiredWorker: Worker = {
    ...worker,
    status: 'employed',
    employedBy: store.id,
    salaryCurrent: request.offeredSalary,
    weeksEmployed: 0
  };
  const employees = [...store.employees, hiredWorker];
  const staff = deriveStaffFromEmployees(employees, store.staff.averageSalary);

  return {
    store: {
      ...store,
      employees,
      staff,
      serviceLevel: staff.serviceLevel,
      jobRequests: store.jobRequests.map((item) =>
        item.id === requestId ? { ...item, selectedWorkerId: workerId, status: 'cancelled' } : item
      )
    },
    cityWorkers: cityWorkers.map((item) => (item.id === workerId ? { ...hiredWorker } : item))
  };
};

export const updateEmployeeRetention = (
  store: StoreEntity,
  cityWorkers: Worker[],
  week: number
): { store: StoreEntity; cityWorkers: Worker[]; events: string[] } => {
  const events: string[] = [];
  const remaining: Worker[] = [];
  let nextWorkers = cityWorkers.map((worker) => ({ ...worker }));

  store.employees.forEach((employee) => {
    const salarySatisfaction = (employee.salaryCurrent ?? employee.expectedSalary) / employee.expectedSalary;
    const leaveScore =
      (salarySatisfaction < 0.9 ? 22 : 0) +
      (store.staff.workload > 1.15 ? 18 : 0) +
      (store.financialHealth === 'cash_gap' || store.financialHealth === 'pre_bankruptcy' ? 22 : 0) +
      (100 - employee.loyalty) * 0.18 -
      employee.stressResistance * 0.08;

    if (leaveScore > 32) {
      events.push(`Неделя ${week}: сотрудник ${employee.name} ушёл из магазина.`);
      nextWorkers = nextWorkers.map((worker) =>
        worker.id === employee.id
          ? { ...worker, status: 'unavailable', employedBy: undefined, salaryCurrent: undefined, unavailableUntilWeek: week + 2 }
          : worker
      );
    } else {
      remaining.push({ ...employee, weeksEmployed: employee.weeksEmployed + 1 });
    }
  });

  const staff = deriveStaffFromEmployees(remaining, store.staff.averageSalary);
  return {
    store: { ...store, employees: remaining, staff, serviceLevel: clamp(staff.serviceLevel, 0.4, 1.7) },
    cityWorkers: nextWorkers,
    events
  };
};
