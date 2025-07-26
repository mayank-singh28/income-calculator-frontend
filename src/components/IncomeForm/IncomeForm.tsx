import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { Card, CardHeader, CardContent } from "../Card/Card";
import { Input } from "../Input/Input";
import { Button } from "../Button/Button";
import { useToast } from "../Toast/Toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  insertUserSettingsSchema,
  type InsertUserSettings,
} from "../../schema/schema";
import "./IncomeForm.css";
import { BASE_URL } from "@/constant";

interface IncomeFormProps {
  onSettingsCreated: (settingsId: string) => void;
}

export const IncomeForm: React.FC<IncomeFormProps> = ({
  onSettingsCreated,
}) => {
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<InsertUserSettings>({
    defaultValues: {
      monthlySalary: 0,
      dailyHours: 0,
      weeklyDays: 0,
      isHoliday: false,
    },
  });

  const createSettingsMutation = useMutation({
    mutationFn: async (data: InsertUserSettings) => {
      const response = await fetch(`${BASE_URL}/api/user-settings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error("Failed to create settings");
      }

      return response.json();
    },
    onSuccess: (data) => {
      showToast("Salary settings saved successfully!", "success");
      onSettingsCreated(data.id);
      reset();
    },
    onError: (error) => {
      showToast("Failed to save settings. Please try again.", "error");
      console.error("Error creating settings:", error);
    },
  });

  const onSubmit = (data: InsertUserSettings) => {
    console.log("Form submitted with data:", data);
    console.log("Form errors:", errors);

    try {
      const validatedData = insertUserSettingsSchema.parse(data);
      console.log("Validated data:", validatedData);
      createSettingsMutation.mutate(validatedData);
    } catch (error) {
      console.error("Validation error:", error);
      showToast("Please check your input values", "error");
    }
  };

  return (
    <Card className="income-form">
      <CardHeader>
        <h2 className="income-form__title">Setup Your Salary Information</h2>
        <p className="income-form__description">
          Enter your salary details to start tracking your real-time earnings
        </p>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="income-form__form">
          <div className="income-form__grid">
            <Input
              label="Monthly Salary (₹)"
              type="number"
              placeholder="e.g., 50000"
              {...register("monthlySalary", {
                required: "Monthly salary is required",
                valueAsNumber: true,
                min: { value: 1, message: "Salary must be greater than 0" },
              })}
              error={errors.monthlySalary?.message}
            />

            <Input
              label="Daily Working Hours"
              type="number"
              placeholder="e.g., 8"
              {...register("dailyHours", {
                required: "Daily hours is required",
                valueAsNumber: true,
                min: { value: 1, message: "Must work at least 1 hour" },
                max: { value: 24, message: "Cannot exceed 24 hours" },
              })}
              error={errors.dailyHours?.message}
            />

            <Input
              label="Working Days per Week"
              type="number"
              placeholder="e.g., 5"
              {...register("weeklyDays", {
                required: "Weekly days is required",
                valueAsNumber: true,
                min: { value: 1, message: "Must work at least 1 day per week" },
                max: { value: 7, message: "Cannot exceed 7 days per week" },
              })}
              error={errors.weeklyDays?.message}
            />

            <div className="income-form__checkbox">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  {...register("isHoliday")}
                  className="checkbox-input"
                />
                <span className="checkbox-custom"></span>
                <span className="checkbox-text">Today is a holiday</span>
              </label>
            </div>
          </div>

          <Button
            type="submit"
            size="large"
            loading={createSettingsMutation.isPending}
            className="income-form__submit"
          >
            Save Settings & Start Tracking
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
