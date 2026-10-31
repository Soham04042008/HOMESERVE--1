package com.homeserve.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.Instant;
import java.util.Base64;

/** A small signed bearer token for this college-project API. Use a standard OAuth/JWT solution for production. */
@Service
public class SessionTokenService {
    private final byte[] secret;
    private final SecureRandom random = new SecureRandom();
    private final Base64.Encoder encoder = Base64.getUrlEncoder().withoutPadding();
    private final Base64.Decoder decoder = Base64.getUrlDecoder();

    public SessionTokenService(@Value("${homeserve.auth.secret:DEV_ONLY_CHANGE_THIS_SECRET_TO_A_LONG_RANDOM_VALUE}") String secret) {
        if (secret == null || secret.length() < 32) {
            throw new IllegalArgumentException("homeserve.auth.secret must be at least 32 characters");
        }
        this.secret = secret.getBytes(StandardCharsets.UTF_8);
    }

    public String createToken(Long userId) {
        long expiresAt = Instant.now().plusSeconds(24 * 60 * 60).getEpochSecond();
        byte[] nonce = new byte[16];
        random.nextBytes(nonce);
        String payload = userId + "|" + expiresAt + "|" + encoder.encodeToString(nonce);
        String encodedPayload = encoder.encodeToString(payload.getBytes(StandardCharsets.UTF_8));
        return encodedPayload + "." + encoder.encodeToString(sign(encodedPayload));
    }

    public Long userIdFromAuthorization(String authorization) {
        if (authorization == null || !authorization.startsWith("Bearer ")) return null;
        try {
            String token = authorization.substring(7).trim();
            String[] parts = token.split("\\.", -1);
            if (parts.length != 2) return null;
            byte[] providedSignature = decoder.decode(parts[1]);
            if (!MessageDigest.isEqual(sign(parts[0]), providedSignature)) return null;
            String payload = new String(decoder.decode(parts[0]), StandardCharsets.UTF_8);
            String[] values = payload.split("\\|", -1);
            if (values.length != 3 || Long.parseLong(values[1]) <= Instant.now().getEpochSecond()) return null;
            return Long.parseLong(values[0]);
        } catch (RuntimeException ex) {
            return null;
        }
    }

    private byte[] sign(String value) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(secret, "HmacSHA256"));
            return mac.doFinal(value.getBytes(StandardCharsets.UTF_8));
        } catch (Exception ex) {
            throw new IllegalStateException("Unable to sign session token", ex);
        }
    }
}
