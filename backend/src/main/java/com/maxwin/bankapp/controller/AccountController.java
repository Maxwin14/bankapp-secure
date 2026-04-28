package com.maxwin.bankapp.controller;

import com.maxwin.bankapp.dto.AccountDirectoryResponse;
import com.maxwin.bankapp.entity.Account;
import com.maxwin.bankapp.repository.AccountRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Random;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@CrossOrigin
@RequestMapping("/api/accounts")
public class AccountController {

    @Autowired
    private AccountRepository accountRepository;

    @PostMapping("/open")
    public ResponseEntity<Account> openAccount(Authentication authentication) {
        String loggedInUserId = authentication.getName();

        Account newAccount = new Account();
        newAccount.setAccountId(UUID.randomUUID().toString());
        newAccount.setUserId(loggedInUserId);
        newAccount.setAccountNumber(generateUniqueAccountNumber());
        newAccount.setBalance(new BigDecimal("0.00"));
        newAccount.setStatus("ACTIVE");
        newAccount.setIsActive(true);

        return ResponseEntity.ok(accountRepository.save(newAccount));
    }

    @GetMapping("/me")
    public List<Account> getMyAccounts(Authentication authentication) {
        return accountRepository.findByUserId(authentication.getName());
    }

    // Backward-compatible route. It now only returns accounts if the path ID is the logged-in user.
    @GetMapping("/user/{userId}")
    public ResponseEntity<?> getUserAccounts(@PathVariable String userId, Authentication authentication) {
        if (!authentication.getName().equals(userId)) {
            return ResponseEntity.status(403).body("FAILED: You can only view your own accounts.");
        }
        return ResponseEntity.ok(accountRepository.findByUserId(userId));
    }

    // Public directory for transfers/contact book. Does not expose balances.
    @GetMapping("/all")
    public List<AccountDirectoryResponse> getAccountDirectory() {
        return accountRepository.findAll().stream()
                .filter(account -> Boolean.TRUE.equals(account.getIsActive()))
                .map(AccountDirectoryResponse::new)
                .collect(Collectors.toList());
    }

    private String generateUniqueAccountNumber() {
        Random random = new Random();
        String accountNumber;
        do {
            accountNumber = String.format("%010d", random.nextInt(1_000_000_000));
        } while (accountRepository.findByAccountNumber(accountNumber).isPresent());
        return accountNumber;
    }
}
