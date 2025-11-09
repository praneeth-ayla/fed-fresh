"use client";

import { useState } from "react";

type OrderType = "ONE_TIME" | "WEEKLY_PLAN" | "CUSTOM_DAYS";

interface DateSelectorProps {
  orderType: OrderType;
  onDatesChange: (dates: string[]) => void;
  onClose: () => void;
  initialDates?: string[];
}

export default function DateSelector({
  orderType,
  onDatesChange,
  onClose,
  initialDates = [],
}: DateSelectorProps) {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [selectedDates, setSelectedDates] = useState<string[]>(initialDates);

  // Helper functions
  const formatDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const parseDate = (dateString: string): Date => {
    const [year, month, day] = dateString.split("-").map(Number);
    return new Date(year, month - 1, day);
  };

  const isDateInPast = (date: Date): boolean => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  const getWeekStartDate = (date: Date): Date => {
    const day = date.getDay();
    const start = new Date(date);
    // If it's Sunday, go back 6 days to get to Monday
    // Otherwise, go back (day - 1) days to get to Monday
    const daysToSubtract = day === 0 ? 6 : day - 1;
    start.setDate(date.getDate() - daysToSubtract);
    return start;
  };

  const getWeekDays = (startDate: Date): Date[] => {
    const dates: Date[] = [];
    const start = new Date(startDate);

    for (let day = 0; day < 5; day++) {
      // Monday to Friday only
      const currentDate = new Date(start);
      currentDate.setDate(start.getDate() + day);
      dates.push(currentDate);
    }
    return dates;
  };

  const isWeekday = (date: Date): boolean => {
    const day = date.getDay();
    return day >= 1 && day <= 5; // Monday to Friday
  };

  // Calendar navigation
  const navigateMonth = (direction: number) => {
    let newMonth = currentMonth + direction;
    let newYear = currentYear;

    if (newMonth < 0) {
      newMonth = 11;
      newYear--;
    } else if (newMonth > 11) {
      newMonth = 0;
      newYear++;
    }

    setCurrentMonth(newMonth);
    setCurrentYear(newYear);
  };

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  // Date selection handlers
  const handleDateSelect = (date: Date) => {
    if (isDateInPast(date) || !isWeekday(date)) return;

    const dateString = formatDate(date);

    switch (orderType) {
      case "ONE_TIME":
        const newDates = [dateString];
        setSelectedDates(newDates);
        onDatesChange(newDates);
        break;

      case "WEEKLY_PLAN":
        const weekStart = getWeekStartDate(date);

        // Check if the week start is in the past
        if (isDateInPast(weekStart)) {
          alert(
            "Cannot select past weeks. Please select a future week starting from Monday."
          );
          return;
        }

        // Get all days for this week
        const weekDates = getWeekDays(weekStart);
        const weekDateStrings = weekDates.map(formatDate);

        // Check if this week is already selected
        const isWeekAlreadySelected = weekDateStrings.every((date) =>
          selectedDates.includes(date)
        );

        let newSelectedDates: string[];

        if (isWeekAlreadySelected) {
          // Remove this week from selection
          newSelectedDates = selectedDates.filter(
            (date) => !weekDateStrings.includes(date)
          );
        } else {
          // Add this week to selection
          // Remove any dates that might be in this week first (to avoid duplicates)
          const datesWithoutThisWeek = selectedDates.filter(
            (date) => !weekDateStrings.includes(date)
          );
          newSelectedDates = [
            ...datesWithoutThisWeek,
            ...weekDateStrings,
          ].sort();
        }

        setSelectedDates(newSelectedDates);
        onDatesChange(newSelectedDates);
        break;

      case "CUSTOM_DAYS":
        const newCustomDates = selectedDates.includes(dateString)
          ? selectedDates.filter((d) => d !== dateString)
          : [...selectedDates, dateString].sort();

        setSelectedDates(newCustomDates);
        onDatesChange(newCustomDates);
        break;
    }
  };

  const isDateSelected = (date: Date): boolean => {
    const dateString = formatDate(date);
    return selectedDates.includes(dateString);
  };

  const isDateDisabled = (date: Date): boolean => {
    if (isDateInPast(date)) return true;
    if (orderType === "WEEKLY_PLAN" && !isWeekday(date)) return true;
    return false;
  };

  // Get all selected weeks for display
  const getSelectedWeeks = (): string[] => {
    if (orderType !== "WEEKLY_PLAN") return [];

    const weekStarts = new Set<string>();

    selectedDates.forEach((dateStr) => {
      const date = parseDate(dateStr);
      const weekStart = getWeekStartDate(date);
      weekStarts.add(formatDate(weekStart));
    });

    return Array.from(weekStarts).sort();
  };

  const getNextMonday = (): Date => {
    const today = new Date();
    const day = today.getDay();
    const daysUntilMonday = day === 0 ? 1 : day === 1 ? 0 : 8 - day;
    const nextMonday = new Date(today);
    nextMonday.setDate(today.getDate() + daysUntilMonday);
    return nextMonday;
  };

  const handleQuickSelectNextWeek = () => {
    if (orderType === "WEEKLY_PLAN") {
      const nextMonday = getNextMonday();
      const weekDates = getWeekDays(nextMonday);
      const weekDateStrings = weekDates.map(formatDate);

      // Check if this week is already selected
      const isWeekAlreadySelected = weekDateStrings.every((date) =>
        selectedDates.includes(date)
      );

      let newSelectedDates: string[];

      if (isWeekAlreadySelected) {
        // Remove this week from selection
        newSelectedDates = selectedDates.filter(
          (date) => !weekDateStrings.includes(date)
        );
      } else {
        // Add this week to selection
        const datesWithoutThisWeek = selectedDates.filter(
          (date) => !weekDateStrings.includes(date)
        );
        newSelectedDates = [...datesWithoutThisWeek, ...weekDateStrings].sort();
      }

      setSelectedDates(newSelectedDates);
      onDatesChange(newSelectedDates);

      // Navigate to the month of the selected week
      setCurrentMonth(nextMonday.getMonth());
      setCurrentYear(nextMonday.getFullYear());
    }
  };

  // Render calendar
  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDay = getFirstDayOfMonth(currentYear, currentMonth);

  const days = [];

  // Empty cells for days before the first day of the month
  for (let i = 0; i < firstDay; i++) {
    days.push(<div key={`empty-${i}`} className="h-8"></div>);
  }

  // Days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(currentYear, currentMonth, day);
    const isSelected = isDateSelected(date);
    const isDisabled = isDateDisabled(date);
    const isWeekend = !isWeekday(date);

    days.push(
      <button
        key={day}
        onClick={() => handleDateSelect(date)}
        disabled={isDisabled}
        className={`h-8 w-8 rounded-full text-sm flex items-center justify-center
          ${isDisabled ? "text-gray-300 cursor-not-allowed" : ""}
          ${isSelected ? "bg-blue-500 text-white" : ""}
          ${!isDisabled && !isSelected && isWeekend ? "text-gray-400" : ""}
          ${
            !isDisabled && !isSelected && !isWeekend
              ? "text-gray-700 hover:bg-gray-100"
              : ""
          }
        `}
      >
        {day}
      </button>
    );
  }

  const selectedWeeks = getSelectedWeeks();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg border max-w-sm mx-auto">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => navigateMonth(-1)}
            className="p-2 hover:bg-gray-100 rounded"
          >
            ‹
          </button>
          <h3 className="font-semibold text-lg">
            {new Date(currentYear, currentMonth).toLocaleString("default", {
              month: "long",
              year: "numeric",
            })}
          </h3>
          <button
            onClick={() => navigateMonth(1)}
            className="p-2 hover:bg-gray-100 rounded"
          >
            ›
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center text-sm text-gray-500 mb-2">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div
              key={day}
              className={day === "Sun" || day === "Sat" ? "text-gray-400" : ""}
            >
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">{days}</div>

        {/* Quick select for weekly plan */}
        {orderType === "WEEKLY_PLAN" && (
          <div className="mt-4">
            <button
              onClick={handleQuickSelectNextWeek}
              className="w-full bg-blue-100 text-blue-700 py-2 rounded hover:bg-blue-200 text-sm"
            >
              {selectedWeeks.some(
                (week) => week === formatDate(getNextMonday())
              )
                ? "Remove Next Week"
                : "Add Next Week"}
            </button>
          </div>
        )}

        {/* Selection Info */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium mb-2">
            {orderType === "ONE_TIME" && "Single Delivery"}
            {orderType === "WEEKLY_PLAN" && "Weekly Plan"}
            {orderType === "CUSTOM_DAYS" && "Custom Dates"}
          </h4>

          {orderType === "ONE_TIME" && selectedDates.length > 0 && (
            <p className="text-sm text-gray-600">Date: {selectedDates[0]}</p>
          )}

          {orderType === "WEEKLY_PLAN" && (
            <div>
              <p className="text-sm text-gray-600">
                {selectedWeeks.length} week
                {selectedWeeks.length !== 1 ? "s" : ""} selected
              </p>
              <p className="text-sm text-gray-600">
                {selectedDates.length} total deliveries
              </p>
              {selectedWeeks.length > 0 && (
                <div className="mt-2 max-h-24 overflow-y-auto">
                  {selectedWeeks.map((weekStart) => (
                    <div key={weekStart} className="text-xs text-gray-500 mb-1">
                      Week of {weekStart}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {orderType === "CUSTOM_DAYS" && (
            <div>
              <p className="text-sm text-gray-600">
                {selectedDates.length} delivery
                {selectedDates.length > 1 ? "s" : ""} selected
              </p>
              {selectedDates.length > 0 && (
                <div className="mt-2 max-h-24 overflow-y-auto">
                  {selectedDates.slice(0, 5).map((date) => (
                    <div key={date} className="text-xs text-gray-500">
                      {date}
                    </div>
                  ))}
                  {selectedDates.length > 5 && (
                    <div className="text-xs text-gray-500">
                      ... and {selectedDates.length - 5} more
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-between items-center">
          <button
            onClick={() => {
              setSelectedDates([]);
              onDatesChange([]);
              onClose();
            }}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            Clear All
          </button>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Confirm
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
