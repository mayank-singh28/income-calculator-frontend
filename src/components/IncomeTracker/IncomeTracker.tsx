import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardContent } from "../Card/Card";
import { Button } from "../Button/Button";
import { ProgressBar } from "../ProgressBar/ProgressBar";
import { useToast } from "../Toast/Toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { formatCurrency, formatTime } from "@/lib/utils";
import "./IncomeTracker.css";
import { BASE_URL } from "../../constant.ts";

interface IncomeTrackerProps {
  userSettingsId: string;
  onReset: () => void;
}

interface CalculatedRates {
  perMinute: number;
  perHour: number;
  perDay: number;
  monthlyHours: number;
}

interface ActiveSession {
  id: string;
  sessionStart: string;
  isActive: boolean;
  totalEarned?: number;
}

export const IncomeTracker: React.FC<IncomeTrackerProps> = ({
  userSettingsId,
  onReset,
}) => {
  const [isTracking, setIsTracking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [currentEarnings, setCurrentEarnings] = useState(0);
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const { data: rates } = useQuery<CalculatedRates>({
    queryKey: ["rates", userSettingsId],
    queryFn: () =>
      fetch(`${BASE_URL}/api/calculate-rates/${userSettingsId}`).then((res) =>
        res.json()
      ),
  });

  const { data: activeSession } = useQuery<ActiveSession | null>({
    queryKey: ["incomeSession", userSettingsId],
    queryFn: () =>
      fetch(`${BASE_URL}/api/income-session/${userSettingsId}`).then((res) =>
        res.status === 404 ? null : res.json()
      ),
    refetchInterval: isTracking && !isPaused ? 1000 : false,
  });

  const startSessionMutation = useMutation({
    mutationFn: () =>
      fetch(`${BASE_URL}/api/income-session`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userSettingsId }),
      }).then((res) => res.json()),
    onSuccess: () => {
      setIsTracking(true);
      setIsPaused(false);
      setElapsedSeconds(0);
      setCurrentEarnings(0);
      showToast("Income tracking started!", "success");
      queryClient.invalidateQueries({
        queryKey: ["incomeSession"],
      });
    },
    onError: () => {
      showToast("Failed to start tracking", "error");
    },
  });

  const endSessionMutation = useMutation({
    mutationFn: (sessionId: string) =>
      fetch(`${BASE_URL}/api/income-session/${sessionId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ totalEarned: currentEarnings }),
      }).then((res) => res.json()),
    onSuccess: (data) => {
      setIsTracking(false);
      setIsPaused(false);
      setElapsedSeconds(0);
      setCurrentEarnings(0);
      showToast(
        `Session ended. Total earned: ${formatCurrency(data.totalEarned)}`,
        "success"
      );
      // queryClient.invalidateQueries({
      //   queryKey: ["incomeSession"],
      // });
    },
    onError: () => {
      showToast("Failed to end session", "error");
    },
  });

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isTracking && !isPaused && rates) {
      interval = setInterval(() => {
        setElapsedSeconds((prev) => {
          const newSeconds = prev + 1;
          const newEarnings = (newSeconds / 60) * rates.perMinute;
          setCurrentEarnings(newEarnings);
          return newSeconds;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTracking, isPaused, rates]);

  useEffect(() => {
    if (activeSession && rates) {
      setIsTracking(true);
      setIsPaused(false);
      const sessionStart = new Date(activeSession.sessionStart);
      const now = new Date();
      const elapsed = Math.floor(
        (now.getTime() - sessionStart.getTime()) / 1000
      );
      setElapsedSeconds(elapsed);
      setCurrentEarnings((elapsed / 60) * rates.perMinute);
    } else if (!activeSession) {
      setIsTracking(false);
      setIsPaused(false);
      setElapsedSeconds(0);
      setCurrentEarnings(0);
    }
  }, [activeSession, rates]);

  const handleStartTracking = () => {
    startSessionMutation.mutate();
  };

  const handleStopTracking = () => {
    if (activeSession) {
      endSessionMutation.mutate(activeSession.id);
    }
  };

  const handlePauseResume = () => {
    setIsPaused((prev) => !prev);
    showToast(isPaused ? "Resumed tracking!" : "Paused tracking", "info");
  };

  const progressPercentage = rates
    ? (elapsedSeconds / (rates.monthlyHours * 3600)) * 100
    : 0;

  if (!rates) {
    return (
      <Card>
        <CardContent>
          <div className="income-tracker__loading">Loading rates...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="income-tracker">
      <Card className="income-tracker__main">
        <CardHeader>
          <div className="income-tracker__header">
            <h2 className="income-tracker__title">Income Tracker</h2>
            <Button variant="secondary" size="small" onClick={onReset}>
              Change Settings
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          <div className="income-tracker__stats">
            <div className="stat-card stat-card--primary">
              <div className="stat-card__value">
                {formatCurrency(currentEarnings)}
              </div>
              <div className="stat-card__label">Current Earnings</div>
            </div>

            <div className="stat-card">
              <div className="stat-card__value">
                {formatTime(elapsedSeconds)}
              </div>
              <div className="stat-card__label">Time Elapsed</div>
            </div>

            <div className="stat-card">
              <div className="stat-card__value">
                {formatCurrency(rates.perMinute)}
              </div>
              <div className="stat-card__label">Per Minute</div>
            </div>
          </div>

          <div className="income-tracker__progress">
            <ProgressBar
              value={progressPercentage}
              max={100}
              size="large"
              variant="success"
              showValue
              label="Monthly Progress"
            />
          </div>

          <div className="income-tracker__controls">
            {!isTracking ? (
              <Button
                size="large"
                onClick={handleStartTracking}
                loading={startSessionMutation.isPending}
                className="income-tracker__start-btn"
              >
                Start Tracking Income
              </Button>
            ) : (
              <>
                <Button
                  size="large"
                  onClick={handlePauseResume}
                  className="income-tracker__pause-btn"
                >
                  {isPaused ? "Resume" : "Pause"}
                </Button>
                <Button
                  variant="danger"
                  size="large"
                  onClick={handleStopTracking}
                  loading={endSessionMutation.isPending}
                  className="income-tracker__stop-btn"
                >
                  Stop Tracking
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="income-tracker__rates">
        <CardHeader>
          <h3 className="income-tracker__rates-title">Your Rates</h3>
        </CardHeader>
        <CardContent>
          <div className="rates-grid">
            <div className="rate-item">
              <span className="rate-item__label">Per Hour</span>
              <span className="rate-item__value">
                {formatCurrency(rates.perHour)}
              </span>
            </div>
            <div className="rate-item">
              <span className="rate-item__label">Per Day</span>
              <span className="rate-item__value">
                {formatCurrency(rates.perDay)}
              </span>
            </div>
            <div className="rate-item">
              <span className="rate-item__label">Monthly Hours</span>
              <span className="rate-item__value">
                {rates.monthlyHours.toFixed(1)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
