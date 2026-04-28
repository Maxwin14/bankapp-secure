package com.maxwin.bankapp.repository;

import com.maxwin.bankapp.entity.Account;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AccountRepository extends JpaRepository<Account, String> {
    
    // 1. THE LIST: Find all accounts owned by one person
    List<Account> findByUserId(String userId);
    
    // 2. THE SINGLE BOX: Find one exact account by its human-readable number
    Optional<Account> findByAccountNumber(String accountNumber);
    
}