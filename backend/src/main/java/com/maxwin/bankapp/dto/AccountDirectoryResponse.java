package com.maxwin.bankapp.dto;

import com.maxwin.bankapp.entity.Account;

public class AccountDirectoryResponse {
    private String accountId;
    private String userId;
    private String accountNumber;
    private String status;
    private Boolean isActive;

    public AccountDirectoryResponse(Account account) {
        this.accountId = account.getAccountId();
        this.userId = account.getUserId();
        this.accountNumber = account.getAccountNumber();
        this.status = account.getStatus();
        this.isActive = account.getIsActive();
    }

    public String getAccountId() { return accountId; }
    public String getUserId() { return userId; }
    public String getAccountNumber() { return accountNumber; }
    public String getStatus() { return status; }
    public Boolean getIsActive() { return isActive; }
}
