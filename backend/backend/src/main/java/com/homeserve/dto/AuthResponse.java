package com.homeserve.dto;

public record AuthResponse(String token, UserResponse user) {}
