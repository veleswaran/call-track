package com.calltrack.calltrackapp.db.utilities;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

import androidx.room.TypeConverter;

public class Converters {
    @TypeConverter
    public static String fromList(List<Integer> list) {
        if (list == null) return null;
        return list.stream()
                .map(String::valueOf)
                .collect(Collectors.joining(","));
    }

    @TypeConverter
    public static List<Integer> toList(String data) {
        if (data == null || data.isEmpty()) return new ArrayList<>();
        List<Integer> list = new ArrayList<>();
        for (String s : data.split(",")) {
            list.add(Integer.parseInt(s));
        }
        return list;
    }
}
