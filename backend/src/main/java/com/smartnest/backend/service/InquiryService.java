package com.smartnest.backend.service;

import com.smartnest.backend.dto.CreateInquiryRequest;
import com.smartnest.backend.dto.RespondInquiryRequest;
import com.smartnest.backend.dto.UpdateInquiryRequest;
import com.smartnest.backend.model.Apartment;
import com.smartnest.backend.model.CRO;
import com.smartnest.backend.model.Customer;
import com.smartnest.backend.model.Inquiry;
import com.smartnest.backend.model.InquiryStatus;
import com.smartnest.backend.repository.ApartmentRepository;
import com.smartnest.backend.repository.CRORepository;
import com.smartnest.backend.repository.CustomerRepository;
import com.smartnest.backend.repository.InquiryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class InquiryService {

    private final InquiryRepository inquiryRepository;
    private final CustomerRepository customerRepository;
    private final ApartmentRepository apartmentRepository;
    private final CRORepository croRepository;
    private final NotificationService notificationService;

    @Transactional
    public Inquiry createInquiry(Long customerId, CreateInquiryRequest request) {
        Customer customer = customerRepository.findById(customerId)
                .orElseThrow(() -> new IllegalArgumentException("Customer not found: " + customerId));
        Apartment apartment = apartmentRepository.findById(request.getApartmentId())
                .orElseThrow(() -> new IllegalArgumentException("Apartment not found: " + request.getApartmentId()));

        Inquiry inquiry = new Inquiry();
        inquiry.setCustomer(customer);
        inquiry.setApartment(apartment);
        inquiry.setQuestion(request.getQuestion());
        inquiry.setStatus(InquiryStatus.NEW);

        Inquiry saved = inquiryRepository.save(inquiry);
        notificationService.inquirySubmitted(saved);
        return enrich(saved);
    }

    @Transactional
    public Inquiry claimInquiry(Long inquiryId, Long callerId, boolean isAdmin) {
        Inquiry inquiry = getInquiry(inquiryId);
        if (inquiry.getStatus() != InquiryStatus.NEW) {
            throw new IllegalArgumentException("Only a new inquiry can be claimed");
        }
        if (!isAdmin) {
            inquiry.setCro(getCro(callerId));
        }
        inquiry.setStatus(InquiryStatus.IN_PROGRESS);
        return enrich(inquiryRepository.save(inquiry));
    }

    @Transactional
    public Inquiry respondToInquiry(Long inquiryId, Long callerId, boolean isAdmin, RespondInquiryRequest request) {
        Inquiry inquiry = getInquiry(inquiryId);
        if (inquiry.getStatus() == InquiryStatus.CLOSED) {
            throw new IllegalArgumentException("Cannot respond to a closed inquiry");
        }
        if (!isAdmin) {
            inquiry.setCro(getCro(callerId));
        }
        inquiry.setStaffReply(request.getReply());
        inquiry.setStatus(InquiryStatus.RESPONDED);
        Inquiry saved = inquiryRepository.save(inquiry);
        notificationService.inquiryResponded(saved);
        return enrich(saved);
    }

    @Transactional
    public Inquiry closeInquiry(Long inquiryId, Long callerId, boolean isAdmin) {
        Inquiry inquiry = getInquiry(inquiryId);
        if (!isAdmin) {
            inquiry.setCro(getCro(callerId));
        }
        inquiry.setStatus(InquiryStatus.CLOSED);
        Inquiry saved = inquiryRepository.save(inquiry);
        notificationService.inquiryClosed(saved);
        return enrich(saved);
    }

    @Transactional
    public Inquiry updateInquiry(Long inquiryId, Long callerId, boolean isAdmin, UpdateInquiryRequest request) {
        Inquiry inquiry = getInquiry(inquiryId);
        if (!isAdmin && !inquiry.getCustomer().getUserId().equals(callerId)) {
            throw new AccessDeniedException("You can only edit your own inquiries");
        }
        if (inquiry.getStatus() != InquiryStatus.NEW) {
            throw new IllegalArgumentException("Only a new, unanswered inquiry can be edited");
        }
        inquiry.setQuestion(request.getQuestion());
        return enrich(inquiryRepository.save(inquiry));
    }

    @Transactional
    public void deleteInquiry(Long inquiryId, Long callerId, boolean isAdmin) {
        Inquiry inquiry = getInquiry(inquiryId);
        if (!isAdmin && !inquiry.getCustomer().getUserId().equals(callerId)) {
            throw new AccessDeniedException("You can only delete your own inquiries");
        }
        if (inquiry.getStatus() != InquiryStatus.NEW) {
            throw new IllegalArgumentException("Only a new, unanswered inquiry can be deleted");
        }
        inquiryRepository.delete(inquiry);
    }

    @Transactional(readOnly = true)
    public List<Inquiry> getCustomerInquiries(Long customerId) {
        return enrich(inquiryRepository.findByCustomerUserIdOrderByCreatedDateDesc(customerId));
    }

    @Transactional(readOnly = true)
    public List<Inquiry> getNewInquiries() {
        return enrich(inquiryRepository.findByStatusOrderByCreatedDateAsc(InquiryStatus.NEW));
    }

    @Transactional(readOnly = true)
    public List<Inquiry> getCROInquiries(Long croId) {
        return enrich(inquiryRepository.findByCroUserIdOrderByCreatedDateDesc(croId));
    }

    @Transactional(readOnly = true)
    public List<Inquiry> getAllInquiries() {
        return enrich(inquiryRepository.findAllByOrderByCreatedDateDesc());
    }

    private Inquiry getInquiry(Long id) {
        return inquiryRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Inquiry not found: " + id));
    }

    private CRO getCro(Long id) {
        return croRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("CRO not found: " + id));
    }

    private Inquiry enrich(Inquiry inquiry) {
        return enrich(List.of(inquiry)).get(0);
    }

    private List<Inquiry> enrich(List<Inquiry> inquiries) {
        for (Inquiry i : inquiries) {
            Customer c = i.getCustomer();
            i.setCustomerName(c == null ? null : (c.getFirstName() + " " + c.getLastName()).trim());
            Apartment a = i.getApartment();
            i.setApartmentTitle(a == null ? null : a.getTitle());
            CRO cro = i.getCro();
            i.setCroName(cro == null ? null : (cro.getFirstName() + " " + cro.getLastName()).trim());
        }
        return inquiries;
    }
}
