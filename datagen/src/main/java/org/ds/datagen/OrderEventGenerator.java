package org.ds.datagen;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.apache.kafka.clients.producer.KafkaProducer;
import org.apache.kafka.clients.producer.ProducerConfig;
import org.apache.kafka.clients.producer.ProducerRecord;
import org.apache.kafka.common.serialization.StringSerializer;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Properties;
import java.util.Random;
import java.util.UUID;

/**
 * 电商订单模拟数据生成器（第一阶段：仅订单流）
 *
 * 按数据契约文档生成订单事件并写入 Kafka topic: ec_order_events
 *
 * 用法：
 *   java -jar order-datagen.jar [bootstrap-servers] [rate]
 *   bootstrap-servers: 默认 localhost:9092
 *   rate: 每秒事件数，默认 5
 */
public class OrderEventGenerator {

    private static final String TOPIC = "ec_order_events";
    private static final DateTimeFormatter FMT = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
    private static final ObjectMapper MAPPER = new ObjectMapper();
    private static final Random RND = new Random();

    /** 商品类目及权重（合计 100） */
    private static final String[][] CATEGORIES = {
        {"数码家电", "25"}, {"服饰鞋包", "20"}, {"食品生鲜", "20"},
        {"家居日用", "15"}, {"美妆个护", "10"}, {"运动户外", "10"}
    };

    /** 渠道 */
    private static final String[] CHANNELS = {"APP", "WEB", "MINI_PROGRAM"};

    /** 省份（加权抽样时重点省份权重更高） */
    private static final String[] PROVINCES = {
        "广东省", "浙江省", "上海市", "北京市", "江苏省",
        "山东省", "四川省", "湖北省", "福建省", "河南省",
        "湖南省", "安徽省", "陕西省", "重庆市", "天津市"
    };

    /** 商品名示例（按类目索引对应） */
    private static final String[][] PRODUCT_NAMES = {
        {"无线蓝牙耳机", "智能手环", "4K 显示器", "机械键盘", "平板电脑"},
        {"男士休闲外套", "女士连衣裙", "运动鞋", "真皮手提包", "牛仔裤"},
        {"有机蔬菜礼盒", "进口车厘子", "深海三文鱼", "坚果大礼包", "鲜牛奶"},
        {"乳胶枕头", "香薰加湿器", "收纳置物架", "陶瓷餐具套装", "全自动雨伞"},
        {"水乳护肤套装", "洗面奶", "口红", "防晒霜", "精华液"},
        {"瑜伽垫", "登山背包", "运动水壶", "跑步机", "露营帐篷"}
    };

    public static void main(String[] args) throws Exception {
        String bootstrap = args.length > 0 ? args[0] : "localhost:9092";
        int rate = args.length > 1 ? Integer.parseInt(args[1]) : 5;

        Properties props = new Properties();
        props.put(ProducerConfig.BOOTSTRAP_SERVERS_CONFIG, bootstrap);
        props.put(ProducerConfig.KEY_SERIALIZER_CLASS_CONFIG, StringSerializer.class.getName());
        props.put(ProducerConfig.VALUE_SERIALIZER_CLASS_CONFIG, StringSerializer.class.getName());
        props.put(ProducerConfig.ACKS_CONFIG, "1");
        props.put(ProducerConfig.RETRIES_CONFIG, 3);

        long total = 0;
        try (KafkaProducer<String, String> producer = new KafkaProducer<>(props)) {
            System.out.println("数据生成器启动 | bootstrap=" + bootstrap + " | topic=" + TOPIC + " | rate=" + rate + " 条/秒");
            while (true) {
                long intervalMs = 1000L / rate;
                for (int i = 0; i < rate; i++) {
                    String msg = buildEvent();
                    producer.send(new ProducerRecord<>(TOPIC, msg));
                    total++;
                }
                producer.flush();
                if (total % (rate * 10L) == 0) {
                    System.out.println("已发送 " + total + " 条 | " + LocalDateTime.now().format(FMT));
                }
                Thread.sleep(intervalMs);
            }
        }
    }

    /** 构建一条订单事件 JSON（字段见数据契约文档） */
    private static String buildEvent() throws Exception {
        ObjectNode node = MAPPER.createObjectNode();

        String now = LocalDateTime.now().format(FMT);
        String orderId = "ORD" + now.replaceAll("[^0-9]", "") + String.format("%06d", RND.nextInt(1000000));

        int catIdx = weightedIndex();
        String category = CATEGORIES[catIdx][0];
        String productName = PRODUCT_NAMES[catIdx][RND.nextInt(PRODUCT_NAMES[catIdx].length)];

        // 事件类型分布：PAID 60% / CREATED 25% / CANCELLED 10% / REFUNDED 5%
        String eventType;
        int r = RND.nextInt(100);
        if (r < 60) {
            eventType = "PAID";
        } else if (r < 85) {
            eventType = "CREATED";
        } else if (r < 95) {
            eventType = "CANCELLED";
        } else {
            eventType = "REFUNDED";
        }

        // 租户分布：租户1 70% / 租户2 30%
        long tenantId = RND.nextInt(100) < 70 ? 1L : 2L;

        int quantity = RND.nextInt(5) + 1;
        // 单价 20~5000，偏态（低价商品更多）
        double unitPrice = 20 + Math.pow(RND.nextDouble(), 2) * 4980;
        BigDecimal totalAmount = BigDecimal.valueOf(unitPrice * quantity).setScale(2, RoundingMode.HALF_UP);
        BigDecimal discount = totalAmount.multiply(BigDecimal.valueOf(RND.nextDouble() * 0.2)).setScale(2, RoundingMode.HALF_UP);
        BigDecimal payAmount = totalAmount.subtract(discount);

        node.put("order_id", orderId);
        node.put("user_id", 10000L + RND.nextInt(90000));
        node.put("tenant_id", tenantId);
        node.put("event_type", eventType);
        node.put("product_id", 5000L + RND.nextInt(5000));
        node.put("product_name", productName);
        node.put("category", category);
        node.put("quantity", quantity);
        node.put("unit_price", unitPrice);
        node.put("total_amount", totalAmount);
        node.put("discount_amount", discount);
        node.put("pay_amount", payAmount);
        node.put("channel", CHANNELS[RND.nextInt(CHANNELS.length)]);
        node.put("province", PROVINCES[weightedProvince()]);
        node.put("event_time", now);
        node.put("process_time", now);
        return MAPPER.writeValueAsString(node);
    }

    /** 按权重选择类目索引 */
    private static int weightedIndex() {
        int r = RND.nextInt(100);
        int acc = 0;
        for (int i = 0; i < CATEGORIES.length; i++) {
            acc += Integer.parseInt(CATEGORIES[i][1]);
            if (r < acc) {
                return i;
            }
        }
        return 0;
    }

    /** 省份加权：前 5 个重点省份各占 10%，其余 15 省均分 50% */
    private static int weightedProvince() {
        int r = RND.nextInt(100);
        if (r < 50) {
            return r / 10;
        }
        return 5 + RND.nextInt(PROVINCES.length - 5);
    }
}
