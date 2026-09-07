package com.toonlira.presentation.news.dto;

import java.util.List;

public record NewsSeoResponse(String title, String description, List<String> keywords) {}
