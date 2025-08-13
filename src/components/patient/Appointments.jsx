import React, { useState, useMemo, useRef, useEffect } from "react";
import { useAppointments } from "../../contexts/AppointmentContext";
import { useAuth } from "../../contexts/AuthContext";
import { findDoctorById } from "../../data/dummyData";
import { ChevronDownIcon } from "@heroicons/react/24/outline";

const Appointments = () => {
  const { user } = useAuth();
  const { appointments, doctors, bookAppointment } = useAppointments();

  // Debug logging
  console.log("Appointments component - doctors:", doctors);
  console.log("Appointments component - user:", user);

  const [selectedDoctor, setSelectedDoctor] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [isDoctorOpen, setIsDoctorOpen] = useState(false);
  const [isTimeOpen, setIsTimeOpen] = useState(false);
  const doctorRef = useRef(null);
  const timeRef = useRef(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (doctorRef.current && !doctorRef.current.contains(event.target)) {
        setIsDoctorOpen(false);
      }
      if (timeRef.current && !timeRef.current.contains(event.target)) {
        setIsTimeOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const patientAppointments = useMemo(() => {
    const now = new Date();
    return appointments
      .filter((apt) => apt.patientId === user.id)
      .map((apt) => ({
        ...apt,
        doctor: findDoctorById(apt.doctorId),
        isUpcoming:
          new Date(`${apt.date}T${apt.time.replace(" ", "")}`) >= now &&
          apt.status !== "Cancelled" &&
          apt.status !== "Rejected",
      }))
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [appointments, user.id]);

  const handleBooking = (e) => {
    e.preventDefault();
    if (selectedDoctor && selectedDate && selectedTime) {
      bookAppointment({
        patientId: user.id,
        doctorId: selectedDoctor,
        date: selectedDate,
        time: selectedTime,
      });
      setSelectedDoctor("");
      setSelectedDate("");
      setSelectedTime("");
    }
  };

  const getStatusClass = (status) => {
    switch (status.toLowerCase()) {
      case "confirmed":
        return "bg-green-500";
      case "pending":
        return "bg-yellow-500";
      case "cancelled":
      case "rejected":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  const AppointmentCard = ({ apt }) => (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden relative border border-gray-200 dark:border-gray-700">
      <div
        className={`absolute top-4 right-4 px-3 py-1 text-white text-xs font-bold rounded-full ${
          apt.isUpcoming ? "bg-blue-500" : "bg-gray-500"
        }`}
      >
        {apt.isUpcoming ? "Upcoming" : "Past"}
      </div>
      <div className={`h-2 ${getStatusClass(apt.status)}`}></div>
      <div className="p-6">
        <h3 className="text-2xl font-bold text-gray-700 dark:text-gray-200 mb-4">
          Dr. {apt.doctor?.name || "N/A"}
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-2">
          <strong>Date:</strong> {apt.date}
        </p>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          <strong>Time:</strong> {apt.time}
        </p>
        <div className="flex justify-between items-center">
          <span
            className={`px-4 py-1 text-white text-sm font-semibold rounded-full ${getStatusClass(
              apt.status
            )}`}
          >
            {apt.status}
          </span>
        </div>
      </div>
    </div>
  );

  const CustomSelect = ({
    value,
    onChange,
    options,
    placeholder,
    isOpen,
    setIsOpen,
    ref,
    disabled = false,
  }) => {
    console.log(
      "CustomSelect render - options:",
      options,
      "value:",
      value,
      "isOpen:",
      isOpen
    );

    // Find the selected option to display the label instead of the value
    const selectedOption = options?.find((option) => option.value === value);
    const displayValue = selectedOption ? selectedOption.label : value;

    return (
      <div className="relative" ref={ref}>
        <button
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          className={`w-full p-4 text-left border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-colors ${
            disabled
              ? "bg-gray-200 dark:bg-gray-600 cursor-not-allowed"
              : "bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
          } ${
            value
              ? "text-gray-900 dark:text-gray-100"
              : "text-gray-500 dark:text-gray-400"
          }`}
        >
          <span className="block truncate">{displayValue || placeholder}</span>
          <span className="absolute inset-y-0 right-0 flex items-center pr-2">
            <ChevronDownIcon
              className={`h-5 w-5 text-gray-400 dark:text-gray-500 transition-transform ${
                isOpen ? "rotate-180" : ""
              }`}
            />
          </span>
        </button>

        {isOpen && (
          <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-auto">
            {options && options.length > 0 ? (
              options.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    console.log("Option clicked:", option);
                    onChange(option.value);
                    setIsOpen(false);
                  }}
                  className="w-full px-4 py-2 text-left text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-600 focus:bg-gray-100 dark:focus:bg-gray-600 focus:outline-none"
                >
                  {option.label}
                </button>
              ))
            ) : (
              <div className="px-4 py-2 text-gray-500 dark:text-gray-400 text-center">
                No options available
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const doctorOptions = doctors
    ? doctors.map((doc) => ({
        value: doc.id,
        label: `${doc.name} - ${doc.specialization}`,
      }))
    : [];

  const timeOptions = selectedDoctor
    ? doctors
        .find((d) => d.id === selectedDoctor)
        ?.availability?.map((time) => ({
          value: time,
          label: time,
        })) || []
    : [];

  console.log("doctorOptions:", doctorOptions);
  console.log("timeOptions:", timeOptions);
  console.log("selectedDoctor:", selectedDoctor);

  return (
    <div className="p-8 bg-gradient-to-b from-blue-50 to-blue-100 dark:from-gray-900 dark:to-gray-800 rounded-xl shadow-lg">
      <header className="mb-8 text-center">
        <h2 className="text-4xl font-extrabold text-gray-800 dark:text-gray-100">
          Your Appointments
        </h2>
      </header>

      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
        {patientAppointments.length > 0 ? (
          patientAppointments.map((apt) => (
            <AppointmentCard key={apt.id} apt={apt} />
          ))
        ) : (
          <p className="text-center text-gray-500 dark:text-gray-400 col-span-full">
            You have no appointments.
          </p>
        )}
      </div>

      <div className="mt-12 p-8 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
        <h3 className="text-3xl font-bold text-center text-gray-800 dark:text-gray-100 mb-6">
          Book a New Appointment
        </h3>

        {/* Debug info */}
        {!doctors && (
          <div className="mb-4 p-4 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 rounded-lg">
            <p className="font-semibold">Debug Info:</p>
            <p>Doctors data: {JSON.stringify(doctors)}</p>
            <p>User: {JSON.stringify(user)}</p>
          </div>
        )}

        <form onSubmit={handleBooking} className="flex flex-col gap-6">
          <CustomSelect
            value={selectedDoctor}
            onChange={setSelectedDoctor}
            options={doctorOptions}
            placeholder="Select a Doctor"
            isOpen={isDoctorOpen}
            setIsOpen={setIsDoctorOpen}
            ref={doctorRef}
          />

          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            onClick={(e) => e.target.showPicker?.()}
            className="p-4 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100 cursor-pointer"
          />

          <CustomSelect
            value={selectedTime}
            onChange={setSelectedTime}
            options={timeOptions}
            placeholder="Select a Time"
            isOpen={isTimeOpen}
            setIsOpen={setIsTimeOpen}
            ref={timeRef}
            disabled={!selectedDoctor}
          />

          <button
            type="submit"
            className="p-4 bg-blue-500 text-white font-bold rounded-lg hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 transition-colors"
          >
            Book Now
          </button>
        </form>
      </div>
    </div>
  );
};

export default Appointments;
