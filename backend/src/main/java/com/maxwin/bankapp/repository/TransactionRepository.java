package com.maxwin.bankapp.repository;

import com.maxwin.bankapp.entity.Transaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface TransactionRepository extends JpaRepository<Transaction, String> {
    
    // Updated to match 'TransactionTime' so Spring Boot doesn't get confused!
    Iterable<Transaction> findByFromAccountIdOrToAccountIdOrderByTransactionTimeDesc(String fromAccountId, String toAccountId);
}