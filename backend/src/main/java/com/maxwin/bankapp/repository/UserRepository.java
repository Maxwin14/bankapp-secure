package com.maxwin.bankapp.repository;

import com.maxwin.bankapp.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface UserRepository extends JpaRepository<User, String> {
    
    // We get basic commands like save(), findAll(), and delete() for free.
    // But we can also create custom searches just by naming the method correctly!
   
    // Spring Boot automatically translates this to: SELECT * FROM users WHERE email = ?
    User findByEmail(String email);
    
    // Spring Boot automatically translates this to: SELECT * FROM users WHERE username = ?
    User findByUsername(String username);
 
}