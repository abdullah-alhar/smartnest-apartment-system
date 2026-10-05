package com.smartnest.backend.repository;

import com.smartnest.backend.model.Inquiry;
import com.smartnest.backend.model.InquiryStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface InquiryRepository extends JpaRepository<Inquiry, Long> {

    List<Inquiry> findByCustomerUserIdOrderByCreatedDateDesc(Long customerId);

    List<Inquiry> findByStatusOrderByCreatedDateAsc(InquiryStatus status);

    List<Inquiry> findByCroUserIdOrderByCreatedDateDesc(Long croId);

    List<Inquiry> findAllByOrderByCreatedDateDesc();
}
