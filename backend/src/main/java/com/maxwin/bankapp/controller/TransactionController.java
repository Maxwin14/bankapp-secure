package com.maxwin.bankapp.controller;

import com.maxwin.bankapp.dto.TransferRequest;
import com.maxwin.bankapp.entity.Account;
import com.maxwin.bankapp.entity.Transaction;
import com.maxwin.bankapp.repository.AccountRepository;
import com.maxwin.bankapp.repository.TransactionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@RestController
@CrossOrigin
@RequestMapping("/api/transactions")
public class TransactionController {

    @Autowired
    private AccountRepository accountRepository;

    @Autowired
    private TransactionRepository transactionRepository;

    @Transactional
    @PostMapping("/transfer")
    public ResponseEntity<String> transferMoney(@RequestBody(required = false) TransferRequest body,
                                                @RequestParam(required = false) String senderAccountNumber,
                                                @RequestParam(required = false) String receiverAccountNumber,
                                                @RequestParam(required = false) BigDecimal amount,
                                                Authentication authentication) {
        String actualSender = body != null && body.getSenderAccountNumber() != null ? body.getSenderAccountNumber() : senderAccountNumber;
        String actualReceiver = body != null && body.getReceiverAccountNumber() != null ? body.getReceiverAccountNumber() : receiverAccountNumber;
        BigDecimal actualAmount = body != null && body.getAmount() != null ? body.getAmount() : amount;

        if (actualSender == null || actualReceiver == null || actualAmount == null) {
            return ResponseEntity.badRequest().body("FAILED: Sender, receiver, and amount are required.");
        }
        if (actualAmount.compareTo(BigDecimal.ZERO) <= 0) {
            return ResponseEntity.badRequest().body("FAILED: Amount must be greater than 0.");
        }
        if (actualSender.equals(actualReceiver)) {
            return ResponseEntity.badRequest().body("FAILED: You cannot transfer to the same account.");
        }

        Account sender = accountRepository.findByAccountNumber(actualSender).orElse(null);
        Account receiver = accountRepository.findByAccountNumber(actualReceiver).orElse(null);

        if (sender == null || receiver == null) {
            return ResponseEntity.badRequest().body("FAILED: One or both account numbers do not exist!");
        }
        if (!sender.getUserId().equals(authentication.getName())) {
            return ResponseEntity.status(403).body("FAILED: You can only send money from your own account.");
        }
        if (!Boolean.TRUE.equals(sender.getIsActive()) || !Boolean.TRUE.equals(receiver.getIsActive())) {
            return ResponseEntity.badRequest().body("FAILED: One or both accounts are inactive.");
        }
        if (sender.getBalance().compareTo(actualAmount) < 0) {
            return ResponseEntity.badRequest().body("FAILED: Insufficient funds!");
        }

        sender.setBalance(sender.getBalance().subtract(actualAmount));
        receiver.setBalance(receiver.getBalance().add(actualAmount));

        accountRepository.save(sender);
        accountRepository.save(receiver);

        Transaction receipt = new Transaction();
        receipt.setTransactionId(UUID.randomUUID().toString());
        receipt.setTransactionTime(LocalDateTime.now());
        receipt.setFromAccountId(sender.getAccountId());
        receipt.setToAccountId(receiver.getAccountId());
        receipt.setAmount(actualAmount);
        receipt.setStatus("SUCCESS");

        transactionRepository.save(receipt);

        return ResponseEntity.ok("SUCCESS! Transferred $" + actualAmount + " to account " + actualReceiver);
    }

    @GetMapping("/all")
    public List<Transaction> getMyTransactions(Authentication authentication) {
        List<Account> myAccounts = accountRepository.findByUserId(authentication.getName());
        List<Transaction> result = new ArrayList<>();
        for (Account account : myAccounts) {
            transactionRepository.findByFromAccountIdOrToAccountIdOrderByTransactionTimeDesc(account.getAccountId(), account.getAccountId())
                    .forEach(result::add);
        }
        result.sort((a, b) -> b.getTransactionTime().compareTo(a.getTransactionTime()));
        return result;
    }

    @GetMapping("/history/{accountId}")
    public ResponseEntity<?> getAccountHistory(@PathVariable String accountId, Authentication authentication) {
        Account account = accountRepository.findById(accountId).orElse(null);
        if (account == null) {
            return ResponseEntity.status(404).body("FAILED: Account not found.");
        }
        if (!account.getUserId().equals(authentication.getName())) {
            return ResponseEntity.status(403).body("FAILED: You can only view your own transaction history.");
        }
        return ResponseEntity.ok(transactionRepository.findByFromAccountIdOrToAccountIdOrderByTransactionTimeDesc(accountId, accountId));
    }
}
