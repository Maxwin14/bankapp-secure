package com.maxwin.bankapp.controller;

import com.maxwin.bankapp.dto.ScheduledTransferRequest;
import com.maxwin.bankapp.entity.Account;
import com.maxwin.bankapp.entity.ScheduledTransfer;
import com.maxwin.bankapp.repository.AccountRepository;
import com.maxwin.bankapp.repository.ScheduledTransferRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@CrossOrigin
@RequestMapping("/api/scheduled")
public class ScheduledTransferController {

    @Autowired
    private ScheduledTransferRepository scheduledRepository;

    @Autowired
    private AccountRepository accountRepository;

    @PostMapping("/setup")
    public ResponseEntity<?> setupTransfer(@RequestBody ScheduledTransferRequest request, Authentication authentication) {
        if (request == null || request.getFromAccountNumber() == null || request.getToAccountNumber() == null || request.getAmount() == null) {
            return ResponseEntity.badRequest().body("FAILED: Sender, receiver, and amount are required.");
        }
        if (request.getAmount().compareTo(BigDecimal.ZERO) <= 0) {
            return ResponseEntity.badRequest().body("FAILED: Amount must be greater than 0.");
        }
        if (request.getFromAccountNumber().equals(request.getToAccountNumber())) {
            return ResponseEntity.badRequest().body("FAILED: You cannot schedule a transfer to the same account.");
        }

        Account sender = accountRepository.findByAccountNumber(request.getFromAccountNumber()).orElse(null);
        Account receiver = accountRepository.findByAccountNumber(request.getToAccountNumber()).orElse(null);

        if (sender == null || receiver == null) {
            return ResponseEntity.badRequest().body("FAILED: One or both account numbers do not exist.");
        }
        if (!sender.getUserId().equals(authentication.getName())) {
            return ResponseEntity.status(403).body("FAILED: You can only schedule transfers from your own account.");
        }
        if (!Boolean.TRUE.equals(sender.getIsActive()) || !Boolean.TRUE.equals(receiver.getIsActive())) {
            return ResponseEntity.badRequest().body("FAILED: One or both accounts are inactive.");
        }

        ScheduledTransfer newSchedule = new ScheduledTransfer();
        newSchedule.setTransferId(UUID.randomUUID().toString());
        newSchedule.setFromAccountId(sender.getAccountId());
        newSchedule.setToAccountId(receiver.getAccountId());
        newSchedule.setAmount(request.getAmount());
        newSchedule.setFrequency(request.getFrequency() == null || request.getFrequency().isBlank() ? "MONTHLY" : request.getFrequency());
        newSchedule.setNextRunDate(request.getNextRunDate() == null ? LocalDate.now() : request.getNextRunDate());
        newSchedule.setIsActive(true);

        return ResponseEntity.ok(scheduledRepository.save(newSchedule));
    }

    @GetMapping("/all")
    public List<ScheduledTransfer> getMyScheduled(Authentication authentication) {
        List<String> myAccountIds = accountRepository.findByUserId(authentication.getName())
                .stream()
                .map(Account::getAccountId)
                .collect(Collectors.toList());

        return scheduledRepository.findAll().stream()
                .filter(schedule -> myAccountIds.contains(schedule.getFromAccountId()))
                .collect(Collectors.toList());
    }

    @DeleteMapping("/cancel/{transferId}")
    public ResponseEntity<String> cancelSchedule(@PathVariable String transferId, Authentication authentication) {
        ScheduledTransfer schedule = scheduledRepository.findById(transferId).orElse(null);
        if (schedule == null) {
            return ResponseEntity.status(404).body("FAILED: Scheduled transfer not found.");
        }

        Account sender = accountRepository.findById(schedule.getFromAccountId()).orElse(null);
        if (sender == null || !sender.getUserId().equals(authentication.getName())) {
            return ResponseEntity.status(403).body("FAILED: You can only cancel your own scheduled transfers.");
        }

        scheduledRepository.deleteById(transferId);
        return ResponseEntity.ok("SUCCESS: Scheduled transfer cancelled.");
    }
}
