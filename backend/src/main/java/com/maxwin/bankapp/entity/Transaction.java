package com.maxwin.bankapp.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import java.math.BigDecimal;
import jakarta.persistence.Table;
import java.time.LocalDateTime;

@Entity
@Table(name = "transactions")
public class Transaction {

    @Id
    private String transactionId;
    
    private String fromAccountId;
    private String toAccountId;
    private BigDecimal amount;
    
    // --- NEWLY ADDED VARIABLES ---
    private LocalDateTime transactionTime; 
    private String status;

    // --- GETTERS AND SETTERS ---
    public String getTransactionId() { return transactionId; }
    public void setTransactionId(String transactionId) { this.transactionId = transactionId; }

    public String getFromAccountId() { return fromAccountId; }
    public void setFromAccountId(String fromAccountId) { this.fromAccountId = fromAccountId; }

    public String getToAccountId() { return toAccountId; }
    public void setToAccountId(String toAccountId) { this.toAccountId = toAccountId; }

    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }

    // --- NEWLY ADDED SETTERS/GETTERS ---
    public LocalDateTime getTransactionTime() { return transactionTime; }
    public void setTransactionTime(LocalDateTime transactionTime) { this.transactionTime = transactionTime; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}