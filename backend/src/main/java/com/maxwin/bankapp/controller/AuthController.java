package com.maxwin.bankapp.controller;

import com.maxwin.bankapp.dto.AuthRequest;
import com.maxwin.bankapp.entity.User;
import com.maxwin.bankapp.repository.UserRepository;
import com.maxwin.bankapp.security.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;
import java.util.regex.Pattern;

@RestController
@CrossOrigin
@RequestMapping("/api/auth")
public class AuthController {

    private static final Pattern EMAIL_PATTERN = Pattern.compile("^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$");

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtUtil jwtUtil;

    @PostMapping("/login")
    public ResponseEntity<String> login(@RequestBody(required = false) AuthRequest body,
                                        @RequestParam(required = false) String username,
                                        @RequestParam(required = false) String password) {
        String actualUsername = body != null && body.getUsername() != null ? body.getUsername() : username;
        String actualPassword = body != null && body.getPassword() != null ? body.getPassword() : password;

        if (actualUsername == null || actualPassword == null) {
            return ResponseEntity.badRequest().body("FAILED: Username and password are required.");
        }

        User existingUser = userRepository.findByUsername(actualUsername);
        if (existingUser == null || !passwordMatches(actualPassword, existingUser.getPassword())) {
            return ResponseEntity.status(401).body("FAILED: Incorrect username or password!");
        }

        // One-time migration helper: if an old plain-text password is still in the DB,
        // replace it with a BCrypt hash after successful login.
        if (!existingUser.getPassword().startsWith("$2a$") && !existingUser.getPassword().startsWith("$2b$") && !existingUser.getPassword().startsWith("$2y$")) {
            existingUser.setPassword(passwordEncoder.encode(actualPassword));
            userRepository.save(existingUser);
        }

        return ResponseEntity.ok(jwtUtil.generateToken(existingUser.getUserId()));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<String> resetPassword(@RequestBody(required = false) AuthRequest body,
                                                @RequestParam(required = false) String username,
                                                @RequestParam(required = false) String email,
                                                @RequestParam(required = false) String newPassword) {
        String actualUsername = body != null && body.getUsername() != null ? body.getUsername() : username;
        String actualEmail = body != null && body.getEmail() != null ? body.getEmail() : email;
        String actualNewPassword = body != null && body.getNewPassword() != null ? body.getNewPassword() : newPassword;

        if (actualUsername == null || actualEmail == null || actualNewPassword == null) {
            return ResponseEntity.badRequest().body("FAILED: Username, email, and new password are required.");
        }
        if (actualNewPassword.length() < 8) {
            return ResponseEntity.badRequest().body("FAILED: Password must be at least 8 characters long.");
        }

        User existingUser = userRepository.findByUsername(actualUsername);
        if (existingUser == null || !existingUser.getEmail().equalsIgnoreCase(actualEmail)) {
            return ResponseEntity.status(401).body("FAILED: Identity verification failed. Check username and email.");
        }

        existingUser.setPassword(passwordEncoder.encode(actualNewPassword));
        userRepository.save(existingUser);

        return ResponseEntity.ok("SUCCESS: Password securely updated!");
    }

    @PostMapping("/register")
    public ResponseEntity<String> registerUser(@RequestBody(required = false) AuthRequest body,
                                               @RequestParam(required = false) String username,
                                               @RequestParam(required = false) String email,
                                               @RequestParam(required = false) String password) {
        String actualUsername = body != null && body.getUsername() != null ? body.getUsername() : username;
        String actualEmail = body != null && body.getEmail() != null ? body.getEmail() : email;
        String actualPassword = body != null && body.getPassword() != null ? body.getPassword() : password;

        if (actualUsername == null || actualEmail == null || actualPassword == null) {
            return ResponseEntity.badRequest().body("FAILED: Username, email, and password are required.");
        }
        actualUsername = actualUsername.trim();
        actualEmail = actualEmail.trim().toLowerCase();

        if (actualUsername.length() < 3 || actualUsername.length() > 20) {
            return ResponseEntity.badRequest().body("FAILED: Username must be between 3 and 20 characters.");
        }
        if (!EMAIL_PATTERN.matcher(actualEmail).matches()) {
            return ResponseEntity.badRequest().body("FAILED: Please provide a valid email address.");
        }
        if (actualPassword.length() < 8) {
            return ResponseEntity.badRequest().body("FAILED: Password must be at least 8 characters long.");
        }
        if (userRepository.findByUsername(actualUsername) != null) {
            return ResponseEntity.status(409).body("FAILED: That username is already taken!");
        }
        if (userRepository.findByEmail(actualEmail) != null) {
            return ResponseEntity.status(409).body("FAILED: That email address is already in use!");
        }

        User newUser = new User();
        newUser.setUserId(UUID.randomUUID().toString());
        newUser.setUsername(actualUsername);
        newUser.setEmail(actualEmail);
        newUser.setPassword(passwordEncoder.encode(actualPassword));

        userRepository.save(newUser);

        return ResponseEntity.ok("SUCCESS: Account created successfully! Please log in.");
    }

    private boolean passwordMatches(String rawPassword, String storedPassword) {
        if (storedPassword == null) {
            return false;
        }
        if (storedPassword.startsWith("$2a$") || storedPassword.startsWith("$2b$") || storedPassword.startsWith("$2y$")) {
            return passwordEncoder.matches(rawPassword, storedPassword);
        }
        return storedPassword.equals(rawPassword);
    }
}
