package com.homeserve.dto;

import jakarta.validation.constraints.*;
import java.time.LocalDate;
import java.time.LocalTime;
import java.math.BigDecimal;

public record BookingRequest(
    @NotNull Long userId,
    @NotNull Long workerId,
    @NotNull Long workerServiceId,
    @NotNull @FutureOrPresent LocalDate bookingDate,
    @NotNull LocalTime bookingTime,
    @NotBlank @Size(max=500) String address,
    @Size(max=1000) String notes
) {}