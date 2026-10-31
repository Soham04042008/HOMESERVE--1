package com.homeserve.controller;

import com.homeserve.dto.ServiceRequest;
import com.homeserve.model.HomeService;
import com.homeserve.repository.HomeServiceRepository;
import jakarta.validation.Valid;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController @RequestMapping("/api/services")
public class ServiceController {
 private final HomeServiceRepository repo;
 public ServiceController(HomeServiceRepository repo){this.repo=repo;}
 @GetMapping public List<HomeService> all(@RequestParam(required=false) String category){
  return (category==null||category.isBlank())?repo.findByActiveTrueOrderByNameAsc():repo.findByCategoryIgnoreCaseAndActiveTrueOrderByNameAsc(category.trim());
 }
 @GetMapping("/{id}") public ResponseEntity<?> one(@PathVariable Long id){return repo.findById(id).<ResponseEntity<?>>map(ResponseEntity::ok).orElseGet(()->ResponseEntity.status(404).body(Map.of("message","Service not found")));}
 // Development/admin placeholder. Protect create/update/delete with authorization before public deployment.
 @PostMapping public ResponseEntity<HomeService> create(@Valid @RequestBody ServiceRequest req){HomeService s=from(req,new HomeService());return ResponseEntity.status(201).body(repo.save(s));}
 @PutMapping("/{id}") public ResponseEntity<?> update(@PathVariable Long id,@Valid @RequestBody ServiceRequest req){return repo.findById(id).<ResponseEntity<?>>map(old->{HomeService s=from(req,old);return ResponseEntity.ok(repo.save(s));}).orElseGet(()->ResponseEntity.status(404).body(Map.of("message","Service not found")));}
 @DeleteMapping("/{id}") public ResponseEntity<?> delete(@PathVariable Long id){HomeService s=repo.findById(id).orElse(null);if(s==null)return ResponseEntity.status(404).body(Map.of("message","Service not found"));s.setActive(false);repo.save(s);return ResponseEntity.noContent().build();}
 private HomeService from(ServiceRequest r,HomeService s){s.setName(r.name().trim());s.setCategory(r.category().trim());s.setDescription(r.description());s.setPrice(r.price());s.setImageUrl(r.imageUrl());if(r.active()!=null)s.setActive(r.active());return s;}
}
