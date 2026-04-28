package com.maxwin.bankapp.service;

import com.maxwin.bankapp.entity.Account;
import com.maxwin.bankapp.entity.ScheduledTransfer;
import com.maxwin.bankapp.entity.Transaction;
import com.maxwin.bankapp.repository.AccountRepository;
import com.maxwin.bankapp.repository.ScheduledTransferRepository;
import com.maxwin.bankapp.repository.TransactionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Service
public class TransferEngine {

    @Autowired
    private ScheduledTransferRepository scheduledRepository;

    @Autowired
    private AccountRepository accountRepository;

    @Autowired
    private TransactionRepository transactionRepository;

    @Scheduled(fixedRate = 10000)
    @Transactional
    public void processScheduledTransfers() {
        Iterable<ScheduledTransfer> allSchedules = scheduledRepository.findAll();

        for (ScheduledTransfer schedule : allSchedules) {
            if (!Boolean.TRUE.equals(schedule.getIsActive()) || schedule.getNextRunDate().isAfter(LocalDate.now())) {
                continue;
            }

            Account sender = accountRepository.findById(schedule.getFromAccountId()).orElse(null);
            Account receiver = accountRepository.findById(schedule.getToAccountId()).orElse(null);

            if (sender == null || receiver == null || !Boolean.TRUE.equals(sender.getIsActive()) || !Boolean.TRUE.equals(receiver.getIsActive())) {
                schedule.setIsActive(false);
                scheduledRepository.save(schedule);
                continue;
            }

            if (sender.getBalance().compareTo(schedule.getAmount()) < 0) {
                // Keep the schedule active and try again on the next run date.
                schedule.setNextRunDate(calculateNextRunDate(schedule));
                scheduledRepository.save(schedule);
                continue;
            }

            sender.setBalance(sender.getBalance().subtract(schedule.getAmount()));
            receiver.setBalance(receiver.getBalance().add(schedule.getAmount()));

            accountRepository.save(sender);
            accountRepository.save(receiver);

            Transaction receipt = new Transaction();
            receipt.setTransactionId(UUID.randomUUID().toString());
            receipt.setTransactionTime(LocalDateTime.now());
            receipt.setFromAccountId(sender.getAccountId());
            receipt.setToAccountId(receiver.getAccountId());
            receipt.setAmount(schedule.getAmount());
            receipt.setStatus("SUCCESS");
            transactionRepository.save(receipt);

            if ("ONCE".equalsIgnoreCase(schedule.getFrequency())) {
                schedule.setIsActive(false);
            } else {
                schedule.setNextRunDate(calculateNextRunDate(schedule));
            }
            scheduledRepository.save(schedule);
        }
    }

    private LocalDate calculateNextRunDate(ScheduledTransfer schedule) {
        String frequency = schedule.getFrequency() == null ? "MONTHLY" : schedule.getFrequency().toUpperCase();
        LocalDate baseDate = schedule.getNextRunDate() == null ? LocalDate.now() : schedule.getNextRunDate();

        return switch (frequency) {
            case "DAILY" -> baseDate.plusDays(1);
            case "WEEKLY" -> baseDate.plusWeeks(1);
            case "YEARLY" -> baseDate.plusYears(1);
            default -> baseDate.plusMonths(1);
        };
    }
}
