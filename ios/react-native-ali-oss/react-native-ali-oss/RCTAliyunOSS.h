//
//  react_native_ali_oss.h
//  react-native-ali-oss
//
//  Created by Arthur on 16/5/17.
//  Copyright © 2016年 Arthur. All rights reserved.
//

#import <Foundation/Foundation.h>
#import "OSSClient.h"
#import <RCTBridgeModule.h>

@interface RCTAliyunOSS : NSObject<RCTBridgeModule>
@property (strong) OSSClient* client;

- (void)setUpClient:(NSDictionary*)items;

- (void)putByParams:(NSDictionary*)items success:(RCTResponseSenderBlock)resolve error:(RCTResponseSenderBlock)reject;

@end
