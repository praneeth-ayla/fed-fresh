// components/DateSelector.tsx
"use client";

import { useState, useEffect } from "react";

type OrderType = "ONE_TIME" | "WEEKLY_PLAN" | "CUSTOM_DAYS";

interface DateSelectorProps {
  orderType: OrderType;
  onDatesChange: (dates: string[]) => void;
  onClose: () => void;
  initialDates?: string[];
  weeks?: number;
}

export default function DateSelector({
  orderType,
  onDatesChange,
  onClose,
  initialDates = [],
  weeks = 1,
}: DateSelectorProps) {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [selectedDates, setSelectedDates] = useState<string[]>(initialDates);

  // Helper functions
  const formatDate = (date: Date): string => {
    return date.toISOString().split("T")[0];
  };

  const isDateInPast = (date: Date): boolean => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  const getWeekRange = (date: Date): { start: Date; end: Date } => {
    const day = date.getDay();
    const start = new Date(date);
    start.setDate(date.getDate() - (day === 0 ? 6 : day - 1)); // Monday
    const end = new Date(start);
    end.setDate(start.getDate() + 4); // Friday
    return { start, end };
  };

  const getWeekDays = (startDate: Date, numberOfWeeks: number): Date[] => {
    const dates: Date[] = [];
    for (let week = 0; week < numberOfWeeks; week++) {
      for (let day = 0; day < 5; day++) {
        // Monday to Friday
        const currentDate = new Date(startDate);
        currentDate.setDate(startDate.getDate() + week * 7 + day);
        dates.push(currentDate);
      }
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
        const { start } = getWeekRange(date);
        // Check if the week start is in the past
        if (isDateInPast(start)) {
          alert(
            "Cannot select past weeks. Please select a future week starting from Monday."
          );
          return;
        }
        const weekDates = getWeekDays(start, weeks);
        const weekDateStrings = weekDates.map(formatDate);
        setSelectedDates(weekDateStrings);
        onDatesChange(weekDateStrings);
        break;

      case "CUSTOM_DAYS":
        const newSelectedDates = selectedDates.includes(dateString)
          ? selectedDates.filter((d) => d !== dateString)
          : [...selectedDates, dateString].sort();

        setSelectedDates(newSelectedDates);
        onDatesChange(newSelectedDates);
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

  // Update selected dates when weeks prop changes
  useEffect(() => {
    if (orderType === "WEEKLY_PLAN" && selectedDates.length > 0) {
      const firstDate = new Date(selectedDates[0]);
      const { start } = getWeekRange(firstDate);
      const weekDates = getWeekDays(start, weeks);
      const weekDateStrings = weekDates.map(formatDate);
      setSelectedDates(weekDateStrings);
      onDatesChange(weekDateStrings);
    }
  }, [weeks, orderType]);

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
    const isPast = isDateInPast(date);
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

  const getNextMonday = (): Date => {
    const today = new Date();
    const day = today.getDay();
    const daysUntilMonday = day === 0 ? 1 : 8 - day;
    const nextMonday = new Date(today);
    nextMonday.setDate(today.getDate() + daysUntilMonday);
    return nextMonday;
  };

  const handleQuickSelectNextWeek = () => {
    if (orderType === "WEEKLY_PLAN") {
      const nextMonday = getNextMonday();
      const weekDates = getWeekDays(nextMonday, weeks);
      const weekDateStrings = weekDates.map(formatDate);
      setSelectedDates(weekDateStrings);
      onDatesChange(weekDateStrings);

      // Navigate to the month of the selected week
      setCurrentMonth(nextMonday.getMonth());
      setCurrentYear(nextMonday.getFullYear());
    }
  };

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
              className="w-full bg-blue-100 text-blue-700 py-2 rounded hover:bg-blue-200"
            >
              Select Next Available Week (Starts{" "}
              {getNextMonday().toLocaleDateString()})
            </button>
          </div>
        )}

        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium mb-2">Selection Info:</h4>
          {orderType === "ONE_TIME" && selectedDates.length > 0 && (
            <p>Selected date: {selectedDates[0]}</p>
          )}
          {orderType === "WEEKLY_PLAN" && selectedDates.length > 0 && (
            <div>
              <p>Week starting: {selectedDates[0]}</p>
              <p className="text-sm text-gray-600">
                {weeks} week{weeks > 1 ? "s" : ""} = {selectedDates.length}{" "}
                deliveries
              </p>
            </div>
          )}
          {orderType === "CUSTOM_DAYS" && (
            <div>
              <p>Selected dates: {selectedDates.length}</p>
              {selectedDates.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2 max-h-20 overflow-y-auto">
                  {selectedDates.map((date) => (
                    <span
                      key={date}
                      className="px-2 py-1 bg-blue-100 rounded text-xs"
                    >
                      {date}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-between items-center">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            Close
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Confirm Selection
          </button>
        </div>
      </div>
    </div>
  );
}
