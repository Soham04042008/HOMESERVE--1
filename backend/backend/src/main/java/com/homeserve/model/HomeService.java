package com.homeserve.model;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name="services")
public class HomeService {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
    @Column(nullable=false,length=120) private String name;
    @Column(nullable=false,length=80) private String category;
    @Column(length=1000) private String description;
    @Column(nullable=false,precision=10,scale=2) private BigDecimal price;
    private String imageUrl;
    @Column(nullable=false) private boolean active=true;
    private LocalDateTime createdAt=LocalDateTime.now();
    public HomeService(){}
    public Long getId(){return id;} public String getName(){return name;} public void setName(String v){name=v;}
    public String getCategory(){return category;} public void setCategory(String v){category=v;}
    public String getDescription(){return description;} public void setDescription(String v){description=v;}
    public BigDecimal getPrice(){return price;} public void setPrice(BigDecimal v){price=v;}
    public String getImageUrl(){return imageUrl;} public void setImageUrl(String v){imageUrl=v;}
    public boolean isActive(){return active;} public void setActive(boolean v){active=v;}
    public LocalDateTime getCreatedAt(){return createdAt;}
}
