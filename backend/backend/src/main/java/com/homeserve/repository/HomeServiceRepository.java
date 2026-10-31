package com.homeserve.repository;
import com.homeserve.model.HomeService;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
public interface HomeServiceRepository extends JpaRepository<HomeService,Long> {
    List<HomeService> findByActiveTrueOrderByNameAsc();
    List<HomeService> findByCategoryIgnoreCaseAndActiveTrueOrderByNameAsc(String category);
}
