package com.maxwin.bankapp.repository;
import com.maxwin.bankapp.entity.ScheduledTransfer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ScheduledTransferRepository extends JpaRepository<ScheduledTransfer, String> {
}
