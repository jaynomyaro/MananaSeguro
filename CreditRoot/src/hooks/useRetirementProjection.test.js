import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useRetirementProjection } from "./useRetirementProjection";

describe("useRetirementProjection", () => {
  const initialScenario = {
    monthlyDepositUsd: 25,
    yearsToRetirement: 20,
    annualYieldRate: 4.7,
    incentiveScenario: "fidelidad_constancia",
  };

  it("returns correct initial structure with scenario, projection, and updateScenario", () => {
    const { result } = renderHook(() =>
      useRetirementProjection(initialScenario),
    );

    expect(result.current).toHaveProperty("scenario");
    expect(result.current).toHaveProperty("projection");
    expect(result.current).toHaveProperty("updateScenario");
    expect(typeof result.current.updateScenario).toBe("function");
  });

  it("initializes with provided scenario", () => {
    const { result } = renderHook(() =>
      useRetirementProjection(initialScenario),
    );

    expect(result.current.scenario.monthlyDepositUsd).toBe(25);
    expect(result.current.scenario.yearsToRetirement).toBe(20);
    expect(result.current.scenario.annualYieldRate).toBe(4.7);
    expect(result.current.scenario.incentiveScenario).toBe(
      "fidelidad_constancia",
    );
  });

  it("initializes projection based on scenario", () => {
    const { result } = renderHook(() =>
      useRetirementProjection(initialScenario),
    );

    expect(result.current.projection).toHaveProperty("investedAmount");
    expect(result.current.projection).toHaveProperty("projectedBalance");
    expect(result.current.projection).toHaveProperty("growthAmount");
    expect(result.current.projection).toHaveProperty("estimatedMonthlyIncome");
    expect(result.current.projection).toHaveProperty("totalIncentives");
    expect(result.current.projection).toHaveProperty("incentivePct");
  });

  it("calculates correct investedAmount from initial scenario", () => {
    const { result } = renderHook(() =>
      useRetirementProjection(initialScenario),
    );

    // 25 * 12 months * 20 years = 6000
    expect(result.current.projection.investedAmount).toBe(6000);
  });

  it("matches incentivePct to selected scenario (fidelidad_constancia = 7%)", () => {
    const { result } = renderHook(() =>
      useRetirementProjection(initialScenario),
    );

    expect(result.current.projection.incentivePct).toBe(7);
  });

  it("updateScenario converts monthlyDepositUsd to number", () => {
    const { result } = renderHook(() =>
      useRetirementProjection(initialScenario),
    );

    act(() => {
      result.current.updateScenario("monthlyDepositUsd", "50");
    });

    expect(result.current.scenario.monthlyDepositUsd).toBe(50);
    expect(typeof result.current.scenario.monthlyDepositUsd).toBe("number");
  });

  it("updateScenario converts yearsToRetirement to number", () => {
    const { result } = renderHook(() =>
      useRetirementProjection(initialScenario),
    );

    act(() => {
      result.current.updateScenario("yearsToRetirement", "30");
    });

    expect(result.current.scenario.yearsToRetirement).toBe(30);
    expect(typeof result.current.scenario.yearsToRetirement).toBe("number");
  });

  it("updateScenario converts annualYieldRate to number", () => {
    const { result } = renderHook(() =>
      useRetirementProjection(initialScenario),
    );

    act(() => {
      result.current.updateScenario("annualYieldRate", "6.5");
    });

    expect(result.current.scenario.annualYieldRate).toBe(6.5);
    expect(typeof result.current.scenario.annualYieldRate).toBe("number");
  });

  it("updateScenario keeps incentiveScenario as string", () => {
    const { result } = renderHook(() =>
      useRetirementProjection(initialScenario),
    );

    act(() => {
      result.current.updateScenario("incentiveScenario", "solo_fidelidad");
    });

    expect(result.current.scenario.incentiveScenario).toBe("solo_fidelidad");
    expect(typeof result.current.scenario.incentiveScenario).toBe("string");
  });

  it("projection recalculates when monthlyDepositUsd changes", () => {
    const { result } = renderHook(() =>
      useRetirementProjection(initialScenario),
    );

    const projectionWith25 = result.current.projection.projectedBalance;

    act(() => {
      result.current.updateScenario("monthlyDepositUsd", "50");
    });

    const projectionWith50 = result.current.projection.projectedBalance;

    // 50/month should result in higher balance than 25/month
    expect(projectionWith50).toBeGreaterThan(projectionWith25);
  });

  it("projection recalculates when yearsToRetirement changes", () => {
    const { result } = renderHook(() =>
      useRetirementProjection(initialScenario),
    );

    const projectionWith20 = result.current.projection.projectedBalance;

    act(() => {
      result.current.updateScenario("yearsToRetirement", "30");
    });

    const projectionWith30 = result.current.projection.projectedBalance;

    // 30 years should result in higher balance than 20 years
    expect(projectionWith30).toBeGreaterThan(projectionWith20);
  });

  it("projection recalculates when annualYieldRate changes", () => {
    const { result } = renderHook(() =>
      useRetirementProjection(initialScenario),
    );

    const projectionWith47 = result.current.projection.projectedBalance;

    act(() => {
      result.current.updateScenario("annualYieldRate", "7.0");
    });

    const projectionWith70 = result.current.projection.projectedBalance;

    // Higher yield rate should result in higher balance
    expect(projectionWith70).toBeGreaterThan(projectionWith47);
  });

  it("projection recalculates when incentiveScenario changes", () => {
    const { result } = renderHook(() =>
      useRetirementProjection(initialScenario),
    );

    const projectionWith7pct = result.current.projection.projectedBalance;

    act(() => {
      result.current.updateScenario("incentiveScenario", "solo_fidelidad");
    });

    const projectionWith5pct = result.current.projection.projectedBalance;

    // 7% incentive (fidelidad_constancia) should be higher than 5% (solo_fidelidad)
    expect(projectionWith7pct).toBeGreaterThan(projectionWith5pct);
    expect(result.current.projection.incentivePct).toBe(5);
  });

  it("incentivePct matches selected scenario: solo_fidelidad = 5%", () => {
    const scenario = {
      monthlyDepositUsd: 25,
      yearsToRetirement: 10,
      annualYieldRate: 4.7,
      incentiveScenario: "solo_fidelidad",
    };

    const { result } = renderHook(() => useRetirementProjection(scenario));

    expect(result.current.projection.incentivePct).toBe(5);
  });

  it("incentivePct matches selected scenario: fidelidad_constancia = 7%", () => {
    const scenario = {
      monthlyDepositUsd: 25,
      yearsToRetirement: 10,
      annualYieldRate: 4.7,
      incentiveScenario: "fidelidad_constancia",
    };

    const { result } = renderHook(() => useRetirementProjection(scenario));

    expect(result.current.projection.incentivePct).toBe(7);
  });

  it("incentivePct matches selected scenario: fidelidad_1_referido = 6%", () => {
    const scenario = {
      monthlyDepositUsd: 25,
      yearsToRetirement: 10,
      annualYieldRate: 4.7,
      incentiveScenario: "fidelidad_1_referido",
    };

    const { result } = renderHook(() => useRetirementProjection(scenario));

    expect(result.current.projection.incentivePct).toBe(6);
  });

  it("incentivePct matches selected scenario: fidelidad_2_referidos = 7%", () => {
    const scenario = {
      monthlyDepositUsd: 25,
      yearsToRetirement: 10,
      annualYieldRate: 4.7,
      incentiveScenario: "fidelidad_2_referidos",
    };

    const { result } = renderHook(() => useRetirementProjection(scenario));

    expect(result.current.projection.incentivePct).toBe(7);
  });

  it("handles multiple sequential updates to different fields", () => {
    const { result } = renderHook(() =>
      useRetirementProjection(initialScenario),
    );

    act(() => {
      result.current.updateScenario("monthlyDepositUsd", "100");
    });

    expect(result.current.scenario.monthlyDepositUsd).toBe(100);
    expect(result.current.projection.investedAmount).toBe(24000); // 100 * 12 * 20

    act(() => {
      result.current.updateScenario("yearsToRetirement", "10");
    });

    expect(result.current.scenario.yearsToRetirement).toBe(10);
    expect(result.current.projection.investedAmount).toBe(12000); // 100 * 12 * 10

    act(() => {
      result.current.updateScenario("annualYieldRate", "10");
    });

    expect(result.current.scenario.annualYieldRate).toBe(10);
    // With higher yield and same monthly, balance should increase
    expect(result.current.projection.projectedBalance).toBeGreaterThan(0);
  });

  it("handles zero values correctly", () => {
    const { result } = renderHook(() =>
      useRetirementProjection(initialScenario),
    );

    act(() => {
      result.current.updateScenario("annualYieldRate", "0");
    });

    expect(result.current.scenario.annualYieldRate).toBe(0);
    // With 0 yield, projectedBalance should equal investedAmount
    expect(result.current.projection.projectedBalance).toBe(
      result.current.projection.investedAmount,
    );
  });

  it("maintains projection consistency across updates", () => {
    const { result } = renderHook(() =>
      useRetirementProjection(initialScenario),
    );

    // Store initial state
    const initialScenarioState = JSON.stringify(result.current.scenario);

    act(() => {
      result.current.updateScenario("monthlyDepositUsd", "50");
    });

    // Scenario should have changed
    expect(JSON.stringify(result.current.scenario)).not.toBe(
      initialScenarioState,
    );

    // But projection should still be valid
    expect(result.current.projection.investedAmount).toBeGreaterThan(0);
    expect(result.current.projection.projectedBalance).toBeGreaterThanOrEqual(
      result.current.projection.investedAmount,
    );
  });

  it("handles rapid consecutive updates", () => {
    const { result } = renderHook(() =>
      useRetirementProjection(initialScenario),
    );

    act(() => {
      result.current.updateScenario("monthlyDepositUsd", "50");
      result.current.updateScenario("yearsToRetirement", "25");
      result.current.updateScenario("annualYieldRate", "6");
    });

    expect(result.current.scenario.monthlyDepositUsd).toBe(50);
    expect(result.current.scenario.yearsToRetirement).toBe(25);
    expect(result.current.scenario.annualYieldRate).toBe(6);
    // All three updates should be reflected in the final projection
    expect(result.current.projection.investedAmount).toBe(15000); // 50 * 12 * 25
  });

  it("projection grows as years increase with positive yield", () => {
    const { result } = renderHook(() =>
      useRetirementProjection(initialScenario),
    );

    const projections = [];

    for (let years = 5; years <= 30; years += 5) {
      act(() => {
        result.current.updateScenario("yearsToRetirement", String(years));
      });
      projections.push({
        years,
        balance: result.current.projection.projectedBalance,
      });
    }

    // Each successive year should have higher balance (with positive yield)
    for (let i = 0; i < projections.length - 1; i++) {
      expect(projections[i + 1].balance).toBeGreaterThan(
        projections[i].balance,
      );
    }
  });
});
